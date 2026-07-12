// Auth types — matches Better Auth's User/Session shape
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  token: string;
  expiresAt: string;
  userId: string;
}

// Expense initial data for edit forms
export interface ExpenseInitialData {
  title: string;
  amount: number;
  notes: string | null;
  receiptUrl: string | null;
  splitMethod: 'equal' | 'custom';
  splits: ExpenseSplit[];
  tempId?: string;
  category?: string;
  merchantName?: string | null;
  date?: string | null;
  currency?: string | null;
  lineItems?: any[] | null;
  travelInfo?: any | null;
  smartNotes?: string | null;
}

// Shared sub-types
export interface ExpenseSplit {
  userId: string;
  amount: number;
}
