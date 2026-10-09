import { create } from 'zustand';

export interface PickedLocation { lat: number; lng: number; address: string }

/** One-shot hand-off from the map picker back to the address form (Expo Router has no return params). */
interface PickedLocationState {
  picked: PickedLocation | null;
  set: (p: PickedLocation) => void;
  clear: () => void;
}

export const usePickedLocationStore = create<PickedLocationState>()((set) => ({
  picked: null,
  set: (picked) => set({ picked }),
  clear: () => set({ picked: null }),
}));
