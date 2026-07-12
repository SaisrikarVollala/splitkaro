import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import { expenseSchema } from '../lib/expenseSchema';
import { sendToUser, broadcastToGroup } from './socket';

// Local Type enum definition to bypass SDK import type compatibility issues
const Type = {
  OBJECT: 'OBJECT',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  ARRAY: 'ARRAY',
} as const;

const prisma = new PrismaClient();

// Get API Key and Redis configuration
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const geminiApiKey = process.env.GEMINI_API_KEY;

// Redis Connection config for BullMQ
const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Create BullMQ Queue
export const receiptQueue = new Queue('receipt-processing', { connection: redisConnection as any });

// Create Google Gen AI instance
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Initialize background processing worker
const receiptWorker = new Worker('receipt-processing', async (job) => {
  const { userId, groupId, tempId, absolutePath, filePath } = job.data;
  console.log(`[BullMQ] Starting receipt processing job ${job.id} for tempId: ${tempId}`);

  try {
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Receipt file not found at path: ${absolutePath}`);
    }

    // 1. Perspective correction / flattening and image enhancement via Sharp
    const processedDir = path.dirname(absolutePath);
    const processedFilename = `processed-${path.basename(absolutePath)}`;
    const processedPath = path.join(processedDir, processedFilename);
    const processedUrl = `/uploads/${processedFilename}`;

    console.log(`[BullMQ] Preprocessing image with Sharp: ${absolutePath} -> ${processedPath}`);

    // Preprocess receipt to enhance readability (auto-rotate, normalise/contrast, sharpen)
    await sharp(absolutePath)
      .rotate()       // Rotate based on EXIF tag
      .normalise()    // Standardize contrast/exposure
      .sharpen()      // Enhance characters edges
      .toFile(processedPath);

    // 2. OCR & Structured data extraction via Gemini 3.5 Flash
    if (!ai) {
      throw new Error('GEMINI_API_KEY is not defined in backend configuration.');
    }

    console.log('[BullMQ] Querying Gemini 3.5 Flash for structured data...');
    const imageBase64 = fs.readFileSync(processedPath).toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        },
        'Read this receipt image and parse its attributes.'
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              enum: ['FOOD_DINING', 'ACCOMMODATION', 'TRAVEL_TRANSPORT', 'SHOPPING', 'ENTERTAINMENT', 'TRIP_VACATION', 'HOME_UTILITIES', 'HEALTH_MEDICAL', 'EVENTS_GIFTS', 'OTHER']
            },
            merchantName: { type: Type.STRING },
            date: { type: Type.STRING },
            totalAmount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  price: { type: Type.NUMBER }
                },
                required: ['name', 'price']
              }
            },
            travelInfo: {
              type: Type.OBJECT,
              properties: {
                origin: { type: Type.STRING },
                destination: { type: Type.STRING },
                distanceKm: { type: Type.NUMBER },
                vehicleType: { type: Type.STRING }
              },
              required: ['origin', 'destination']
            },
            smartNotes: { type: Type.STRING }
          },
          required: ['category', 'merchantName', 'totalAmount']
        },
        systemInstruction: `You are an expert AI expense parsing assistant. Extract metadata from the receipt.
        - category: choose from FOOD_DINING, ACCOMMODATION, TRAVEL_TRANSPORT, SHOPPING, ENTERTAINMENT, TRIP_VACATION, HOME_UTILITIES, HEALTH_MEDICAL, EVENTS_GIFTS, OTHER.
        - If category is FOOD_DINING or SHOPPING: parse the tabular lineItems (name, quantity, price).
        - If category is TRAVEL_TRANSPORT: parse travelInfo containing origin, destination, distanceKm, and vehicleType.
        - merchantName: extract the name of the store/merchant.
        - totalAmount: extract the final sum total paid.
        - smartNotes: generate a brief, highly contextual summary of what this expense is about.
        Return raw JSON mapping directly to the response schema.`
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error('Gemini returned an empty text payload.');
    }

    console.log('[BullMQ] Gemini parsing output:', jsonText);
    const parsedData = JSON.parse(jsonText);

    // 3. Validation using Zod
    const validatedData = expenseSchema.parse(parsedData);

    console.log(`[BullMQ] Processed successfully. Broadcasting parsed details for tempId: ${tempId}`);
    
    const payload = {
      tempId,
      status: 'parsed',
      parsedData: {
        category: validatedData.category,
        merchantName: validatedData.merchantName,
        date: validatedData.date || null,
        totalAmount: validatedData.totalAmount,
        currency: validatedData.currency || 'INR',
        lineItems: validatedData.lineItems || null,
        travelInfo: validatedData.travelInfo || null,
        smartNotes: validatedData.smartNotes || null,
        receiptUrl: processedUrl
      }
    };

    // Broadcast to the creator specifically
    sendToUser(userId, 'EXPENSE_PROCESSED', payload);

    // Broadcast to the whole group so others see it
    broadcastToGroup(groupId, 'EXPENSE_PROCESSED', payload);

  } catch (error: any) {
    console.error(`[BullMQ] Error processing job ${job.id}:`, error);

    // Notify user of parsing failure
    sendToUser(userId, 'EXPENSE_PROCESSED', {
      tempId,
      status: 'failed',
      error: error.message || 'Failed to parse receipt'
    });
  }
}, {
  connection: redisConnection as any,
  concurrency: 2
});

// Handle lifecycle events
receiptWorker.on('completed', (job) => {
  console.log(`[BullMQ] Job ${job.id} completed successfully.`);
});

receiptWorker.on('failed', (job, err) => {
  console.error(`[BullMQ] Job ${job?.id} failed with error:`, err);
});
