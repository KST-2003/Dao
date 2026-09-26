import { create } from 'zustand';
import type { SaveableType } from '@/types/enums';

/**
 * Optimistic "saved" (wishlist) state. Cards read the override first, then the server value,
 * so a heart tap is instant everywhere the item appears.
 */
interface SavedState {
  overrides: Record<string, boolean>;
  set: (type: SaveableType, id: number, saved: boolean) => void;
  clear: () => void;
}

export const savedKey = (type: SaveableType, id: number) => `${type}:${id}`;

export const useSavedStore = create<SavedState>()((set) => ({
  overrides: {},
  set: (type, id, saved) => set((s) => ({ overrides: { ...s.overrides, [savedKey(type, id)]: saved } })),
  clear: () => set({ overrides: {} }),
}));

export function useIsSaved(type: SaveableType, id: number, serverValue: boolean): boolean {
  const override = useSavedStore((s) => s.overrides[savedKey(type, id)]);
  return override ?? serverValue;
}
