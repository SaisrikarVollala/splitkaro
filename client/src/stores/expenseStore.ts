import { create } from 'zustand';
import axios from 'axios';
import { api } from '../lib/api';
import { useActiveGroupStore } from './activeGroupStore';

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
}

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  fetchExpenses: (groupId: string) => Promise<void>;
  createExpense: (groupId: string, data: FormData) => Promise<boolean>;
  updateExpense: (expenseId: string, data: FormData) => Promise<boolean>;
  deleteExpense: (expenseId: string) => Promise<boolean>;
  fetchExpenseDetail: (expenseId: string) => Promise<Expense | null>;
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
      set({ expenses: response.data, isLoading: false });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to load expenses'
        : 'Failed to load expenses';
      set({ error: message, isLoading: false });
    }
  },
  
  createExpense: async (groupId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/api/groups/${groupId}/expenses`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      set((state) => ({ 
        expenses: [response.data, ...state.expenses], 
        isLoading: false 
      }));
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
        expenses: state.expenses.map(e => e.id === expenseId ? updatedExpense : e), 
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
          ? state.expenses.map(e => e.id === detailedExpense.id ? detailedExpense : e)
          : [...state.expenses, detailedExpense];
        return { expenses: updatedExpenses };
      });
      return detailedExpense;
    } catch (err) {
      return null;
    }
  }
}));

