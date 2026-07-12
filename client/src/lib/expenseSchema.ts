import { z } from 'zod';

export const expenseSchema = z.object({
  category: z.enum([
    'FOOD_DINING',
    'ACCOMMODATION',
    'TRAVEL_TRANSPORT',
    'SHOPPING',
    'ENTERTAINMENT',
    'TRIP_VACATION',
    'HOME_UTILITIES',
    'HEALTH_MEDICAL',
    'EVENTS_GIFTS',
    'OTHER'
  ]),
  merchantName: z.string().min(1, 'Merchant name is required'),
  date: z.string().nullable().optional(),
  totalAmount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  lineItems: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().default(1),
      price: z.number()
    })
  ).nullable().optional(),
  travelInfo: z.object({
    origin: z.string(),
    destination: z.string(),
    distanceKm: z.number(),
    vehicleType: z.string()
  }).nullable().optional(),
  smartNotes: z.string().nullable().optional()
});

export type ParsedExpense = z.infer<typeof expenseSchema>;
