import { create } from 'zustand';
import axios from 'axios';
import { api } from '../lib/api';
import { Group } from './groupStore';

interface Member {
  id: string;
  name: string;
  image: string | null;
  balance: number;
  isMe: boolean;
}

interface Activity {
  id: string;
  message: string;
  createdAt: string;
}

interface ActiveGroupState {
  currentGroup: (Group & { invitation?: { token: string } | null }) | null;
  members: Member[];
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  fetchGroupDetails: (groupId: string) => Promise<void>;
  fetchMembers: (groupId: string) => Promise<void>;
  fetchActivities: (groupId: string) => Promise<void>;
}

export const useActiveGroupStore = create<ActiveGroupState>((set) => ({
  currentGroup: null,
  members: [],
  activities: [],
  isLoading: true,
  error: null,
  
  fetchGroupDetails: async (groupId) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/api/groups/${groupId}`);
      set({ currentGroup: res.data, isLoading: false });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to load group'
        : 'Failed to load group';
      set({ error: message, isLoading: false });
    }
  },
  
  fetchMembers: async (groupId) => {
    try {
      const res = await api.get(`/api/groups/${groupId}/members`);
      set({ members: res.data });
    } catch (error) {
      console.error(error);
    }
  },
  
  fetchActivities: async (groupId) => {
    try {
      const res = await api.get(`/api/groups/${groupId}/activity`);
      set({ activities: res.data });
    } catch (error) {
      console.error(error);
    }
  }
}));
