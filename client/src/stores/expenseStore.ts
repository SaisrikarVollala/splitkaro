import { create } from 'zustand';
import axios from 'axios';
import { api } from '../lib/api';
import { useActiveGroupStore } from './activeGroupStore';
import { useAuthStore } from './authStore';
import { preprocessReceipt } from '../lib/preprocess';

export interface Expense {
  id: string;
  groupId: string;
  creatorId: string;
  title: string;
  amount: number;
  notes: string | null;
  receiptUrl: string | null;
  splitMethod: 'equal' | 'custom';
  createdAt: string;
  splits: { userId: string; amount: number }[];
  status?: 'scanning' | 'review' | 'ready' | 'failed'; // For Optimistic UI
  category?: 'FOOD_DINING' | 'ACCOMMODATION' | 'TRAVEL_TRANSPORT' | 'SHOPPING' | 'ENTERTAINMENT' | 'TRIP_VACATION' | 'HOME_UTILITIES' | 'HEALTH_MEDICAL' | 'EVENTS_GIFTS' | 'OTHER';
  merchantName?: string | null;
  date?: string | null;
  currency?: string | null;
  lineItems?: { name: string; quantity: number; price: number }[] | null;
  travelInfo?: { origin: string; destination: string; distanceKm: number; vehicleType: string } | null;
  smartNotes?: string | null;
}

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  fetchExpenses: (groupId: string) => Promise<void>;
  createExpense: (groupId: string, data: FormData, tempIdToRemove?: string) => Promise<boolean>;
  updateExpense: (expenseId: string, data: FormData) => Promise<boolean>;
  deleteExpense: (expenseId: string) => Promise<boolean>;
  fetchExpenseDetail: (expenseId: string) => Promise<Expense | null>;
  uploadReceipt: (groupId: string, file: File) => Promise<void>;
  updateExpenseState: (id: string, updatedData: Partial<Expense>) => void;
}

const refreshGroupDerivedState = (groupId: string) => {
  const activeGroup = useActiveGroupStore.getState();
  activeGroup.fetchMembers(groupId);
  activeGroup.fetchActivities(groupId);
};

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  isLoading: false,
  error: null,
  
  fetchExpenses: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/api/groups/${groupId}/expenses`);
      // Map elements with status ready if not scanning
      const expensesWithStatus = response.data.map((exp: any) => ({
        ...exp,
        status: exp.status || 'ready'
      }));
      set({ expenses: expensesWithStatus, isLoading: false });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to load expenses'
        : 'Failed to load expenses';
      set({ error: message, isLoading: false });
    }
  },
  
  createExpense: async (groupId, data, tempIdToRemove) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/api/groups/${groupId}/expenses`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      set((state) => {
        let filtered = state.expenses;
        if (tempIdToRemove) {
          filtered = filtered.filter(e => e.id !== tempIdToRemove);
        }
        return {
          expenses: [{ ...response.data, status: 'ready' }, ...filtered],
          isLoading: false
        };
      });
      refreshGroupDerivedState(groupId);
      return true;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to add expense'
        : 'Failed to add expense';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  updateExpense: async (expenseId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/api/expenses/${expenseId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updatedExpense = response.data;
      set((state) => ({ 
        expenses: state.expenses.map(e => e.id === expenseId ? { ...updatedExpense, status: 'ready' } : e), 
        isLoading: false 
      }));
      if (updatedExpense.groupId) {
        refreshGroupDerivedState(updatedExpense.groupId);
      }
      return true;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to update expense'
        : 'Failed to update expense';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  deleteExpense: async (expenseId) => {
    set({ isLoading: true, error: null });
    try {
      const expense = useExpenseStore.getState().expenses.find(e => e.id === expenseId);
      const groupId = expense?.groupId;

      await api.delete(`/api/expenses/${expenseId}`);
      set((state) => ({ 
        expenses: state.expenses.filter(e => e.id !== expenseId), 
        isLoading: false 
      }));
      if (groupId) {
        refreshGroupDerivedState(groupId);
      }
      return true;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to delete expense'
        : 'Failed to delete expense';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  fetchExpenseDetail: async (expenseId) => {
    try {
      const response = await api.get(`/api/expenses/detail/${expenseId}`);
      const detailedExpense = response.data;
      set((state) => {
        const exists = state.expenses.some(e => e.id === detailedExpense.id);
        const updatedExpenses = exists
          ? state.expenses.map(e => e.id === detailedExpense.id ? { ...detailedExpense, status: 'ready' } : e)
          : [...state.expenses, { ...detailedExpense, status: 'ready' }];
        return { expenses: updatedExpenses };
      });
      return detailedExpense;
    } catch (err) {
      return null;
    }
  },

  uploadReceipt: async (groupId, file) => {
    const tempId = 'temp-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const currentUser = useAuthStore.getState().user;
    const members = useActiveGroupStore.getState().members;
    
    // Optimistic UI placeholder expense object
    const placeholder: Expense = {
      id: tempId,
      groupId,
      creatorId: currentUser?.id || 'unknown',
      title: 'Scanning receipt...',
      amount: 0,
      notes: 'Scanning the receipt via Gemini AI. Please wait...',
      receiptUrl: null,
      splitMethod: 'equal',
      createdAt: new Date().toISOString(),
      splits: members.map(m => ({ userId: m.id, amount: 0 })),
      status: 'scanning'
    };

    set((state) => ({
      expenses: [placeholder, ...state.expenses]
    }));

    // Start asynchronous preprocessing and network upload without blocking UI
    (async () => {
      try {
        const processedBlob = await preprocessReceipt(file);
        const processedFile = new File([processedBlob], 'receipt.jpg', { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('receipt', processedFile);
        formData.append('groupId', groupId);
        formData.append('tempId', tempId);

        await api.post('/api/receipts/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err) {
        console.error('Failed to process and upload receipt:', err);
        // Mark as failed in store
        useExpenseStore.getState().updateExpenseState(tempId, {
          status: 'failed',
          title: 'Scanning failed',
          notes: 'An error occurred during scanning or uploading. Please try again.'
        });
      }
    })();
  },

  updateExpenseState: (id, updatedData) => {
    set((state) => {
      const exists = state.expenses.some(e => e.id === id);
      if (!exists) {
        // If it does not exist (e.g. user refreshed the page or it is a new expense broadcast), prepended
        if (updatedData.groupId) {
          // Trigger derived refresh
          refreshGroupDerivedState(updatedData.groupId);
        }
        return {
          expenses: [{ ...updatedData, status: 'ready' } as Expense, ...state.expenses]
        };
      }
      
      const newExpenses = state.expenses.map((exp) => {
        if (exp.id === id) {
          const merged = {
            ...exp,
            ...updatedData,
            status: updatedData.status || 'ready' // fallback to ready
          };
          // If the final ID comes from DB (e.g. from Socket.io), we want to replace tempId with real database ID
          if (updatedData.id && updatedData.id !== id) {
            merged.id = updatedData.id;
          }
          return merged;
        }
        return exp;
      });

      if (updatedData.groupId) {
        refreshGroupDerivedState(updatedData.groupId);
      }

      return { expenses: newExpenses };
    });
  }
}));
