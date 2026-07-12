import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name is too long'),
});

export const splitItemSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amount: z.number().nonnegative('Split amount must be non-negative'),
});

const baseExpenseSchema = z.object({
  title: z.string().min(1, 'Expense title is required').max(200, 'Title is too long'),
  amount: z.number().positive('Amount must be greater than 0'),
  notes: z.string().optional().nullable(),
  splitMethod: z.enum(['equal', 'custom']),
  splits: z.array(splitItemSchema).min(1, 'At least one split participant is required'),
  category: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  merchantName: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  lineItems: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    price: z.number()
  })).optional().nullable(),
  travelInfo: z.object({
    origin: z.string(),
    destination: z.string(),
    distanceKm: z.number(),
    vehicleType: z.string()
  }).optional().nullable(),
  smartNotes: z.string().optional().nullable(),
});

export const createExpenseSchema = baseExpenseSchema.refine((data) => {
  if (data.splitMethod === 'custom') {
    const sum = data.splits.reduce((acc, split) => acc + split.amount, 0);
    return Math.abs(sum - data.amount) <= 0.02;
  }
  return true;
}, {
  message: "Split amounts must equal the total expense.",
  path: ["splits"]
});

export const updateExpenseSchema = baseExpenseSchema.partial().refine((data) => {
  if (data.splitMethod === 'custom' && data.amount !== undefined && data.splits !== undefined) {
    const sum = data.splits.reduce((acc, split) => acc + split.amount, 0);
    return Math.abs(sum - data.amount) <= 0.02;
  }
  return true;
}, {
  message: "Split amounts must equal the total expense.",
  path: ["splits"]
});

export const createSettlementSchema = z.object({
  payerId: z.string().min(1, 'Payer ID is required'),
  payeeId: z.string().min(1, 'Payee ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
});

// Infer types for TypeScript
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type SplitItem = z.infer<typeof splitItemSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;

