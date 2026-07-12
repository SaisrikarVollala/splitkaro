import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createExpenseSchema, SplitItem } from '../lib/schemas';
import { asyncHandler } from '../middleware/validate';

const router = Router({ mergeParams: true }); // Important to access :groupId if mounted with it
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// GET /api/groups/:groupId/expenses - List expenses for a group
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // Verify membership
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId }});
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      splits: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(expenses);
}));

// POST /api/groups/:groupId/expenses - Create new expense
router.post('/', requireAuth, upload.single('receipt'), asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const userName = req.user.name;

  const { title, amount, notes, splitMethod, splits } = req.body;
  
  // splits comes as JSON string because of FormData
  const parsedSplits = typeof splits === 'string' ? JSON.parse(splits) : splits;
  const parsedAmount = parseFloat(amount);
  
  // Zod validation (bubble up to Central zodErrorHandler)
  const validatedData = createExpenseSchema.parse({
    title,
    amount: parsedAmount,
    notes: notes || null,
    splitMethod,
    splits: parsedSplits
  });

  const receiptUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  // Verify membership
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId }});
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const result = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        groupId,
        creatorId: userId,
        title: validatedData.title,
        amount: validatedData.amount,
        notes: validatedData.notes,
        splitMethod: validatedData.splitMethod,
        receiptUrl: validatedData.receiptUrl || receiptUrl || null,
        category: validatedData.category || null,
        merchantName: validatedData.merchantName || null,
        date: validatedData.date || null,
        currency: validatedData.currency || 'INR',
        lineItems: validatedData.lineItems ? JSON.parse(JSON.stringify(validatedData.lineItems)) : null,
        travelInfo: validatedData.travelInfo ? JSON.parse(JSON.stringify(validatedData.travelInfo)) : null,
        smartNotes: validatedData.smartNotes || null,
        splits: {
          create: validatedData.splits.map((s: SplitItem) => ({
            userId: s.userId,
            amount: s.amount
          }))
        }
      },
      include: { splits: true }
    });

    await tx.activity.create({
      data: {
        groupId,
        message: `${userName} added "${validatedData.title}" for ₹${validatedData.amount}`
      }
    });

    return expense;
  });

  res.status(201).json(result);
}));

// GET /api/expenses/:id - Detail view
router.get('/detail/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { splits: true }
  });
  
  if (!expense) return res.status(404).json({ error: 'Not found' });

  // Ensure user is member of the group
  const isMember = await prisma.groupMember.findFirst({ where: { groupId: expense.groupId, userId }});
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  res.json(expense);
}));

// PUT /api/expenses/:id - Edit expense (Creator Only)
router.put('/:id', requireAuth, upload.single('receipt'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userName = req.user.name;

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return res.status(404).json({ error: 'Not found' });
  
  // CREATOR ONLY GUARD
  if (expense.creatorId !== userId) {
    return res.status(403).json({ error: 'Only the creator can edit this expense.' });
  }

  const { title, amount, notes, splitMethod, splits } = req.body;
  const parsedSplits = typeof splits === 'string' ? JSON.parse(splits) : splits;
  const parsedAmount = parseFloat(amount);

  // Zod validation (bubble up to Central zodErrorHandler)
  const validatedData = createExpenseSchema.parse({
    title,
    amount: parsedAmount,
    notes: notes || null,
    splitMethod,
    splits: parsedSplits
  });

  const receiptUrl = req.file ? `/uploads/${req.file.filename}` : expense.receiptUrl;

  const result = await prisma.$transaction(async (tx) => {
    // Delete old splits
    await tx.expenseSplit.deleteMany({ where: { expenseId: id } });

    // Update expense and create new splits
    const updated = await tx.expense.update({
      where: { id },
      data: {
        title: validatedData.title,
        amount: validatedData.amount,
        notes: validatedData.notes,
        splitMethod: validatedData.splitMethod,
        receiptUrl: validatedData.receiptUrl || receiptUrl,
        category: validatedData.category,
        merchantName: validatedData.merchantName,
        date: validatedData.date,
        currency: validatedData.currency,
        lineItems: validatedData.lineItems ? JSON.parse(JSON.stringify(validatedData.lineItems)) : undefined,
        travelInfo: validatedData.travelInfo ? JSON.parse(JSON.stringify(validatedData.travelInfo)) : undefined,
        smartNotes: validatedData.smartNotes,
        splits: {
          create: validatedData.splits.map((s: SplitItem) => ({
            userId: s.userId,
            amount: s.amount
          }))
        }
      },
      include: { splits: true }
    });

    // Log activity
    await tx.activity.create({
      data: {
        groupId: expense.groupId,
        message: `${userName} edited "${validatedData.title}"`
      }
    });

    return updated;
  });

  res.json(result);
}));

// DELETE /api/expenses/:id - Delete expense (Creator Only)
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userName = req.user.name;

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return res.status(404).json({ error: 'Not found' });
  
  // CREATOR ONLY GUARD
  if (expense.creatorId !== userId) {
    return res.status(403).json({ error: 'Only the creator can delete this expense.' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.expenseSplit.deleteMany({ where: { expenseId: id } });
    await tx.expense.delete({ where: { id } });
    
    await tx.activity.create({
      data: {
        groupId: expense.groupId,
        message: `${userName} deleted "${expense.title}"`
      }
    });
  });

  res.json({ success: true });
}));

export default router;

