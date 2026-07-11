import { z } from 'zod';

export const expenseFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  notes: z.string().max(500, 'Notes are too long').optional(),
  splitMethod: z.enum(['equal', 'custom']),
  selectedMembers: z.array(z.string()).min(1, 'At least one participant must be selected'),
  customSplits: z.record(z.string(), z.coerce.number().nonnegative()).optional(),
}).refine((data) => {
  if (data.splitMethod === 'custom') {
    if (!data.customSplits) return false;
    let sum = 0;
    data.selectedMembers.forEach(id => {
      sum += data.customSplits?.[id] || 0;
    });
    // Floating point precision safety
    return Math.abs(sum - data.amount) <= 0.02;
  }
  return true;
}, {
  message: "Split amounts must equal the total expense.",
  path: ["customSplits"]
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
