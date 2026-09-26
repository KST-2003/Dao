import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  tone: 'default' | 'success' | 'error' | 'gold';
  action?: { label: string; onPress: () => void };
}

interface ToastState {
  current: Toast | null;
  show: (message: string, tone?: Toast['tone'], action?: Toast['action']) => void;
  hide: () => void;
}

let seq = 0;

export const useToastStore = create<ToastState>()((set) => ({
  current: null,
  show: (message, tone = 'default', action) => set({ current: { id: ++seq, message, tone, action } }),
  hide: () => set({ current: null }),
}));

export const toast = {
  show: (message: string, action?: Toast['action']) => useToastStore.getState().show(message, 'default', action),
  success: (message: string, action?: Toast['action']) => useToastStore.getState().show(message, 'success', action),
  error: (message: string) => useToastStore.getState().show(message, 'error'),
  gold: (message: string) => useToastStore.getState().show(message, 'gold'),
};
