import { create } from 'zustand';
import axios from 'axios';
import { api } from '../lib/api';

export interface Group {
  id: string;
  name: string;
  createdAt: string;
  _count?: {
    members: number;
  };
}

interface GroupState {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<{ id: string } | null>;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  isLoading: false,
  error: null,
  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/groups');
      set({ groups: response.data, isLoading: false });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to fetch groups'
        : 'Failed to fetch groups';
      set({ error: message, isLoading: false });
    }
  },
  createGroup: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/groups', { name });
      set((state) => ({ 
        groups: [response.data.group, ...state.groups],
        isLoading: false 
      }));
      return response.data.group;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to create group'
        : 'Failed to create group';
      set({ error: message, isLoading: false });
      return null;
    }
  }
}));
