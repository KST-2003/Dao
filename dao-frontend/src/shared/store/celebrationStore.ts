import { create } from 'zustand';

/** Points earned (gold star) / tier upgrade (DAO star) celebrations. */
export type Celebration = { kind: 'points'; points: number } | { kind: 'tier'; tierName: string };

interface CelebrationState {
  current: Celebration | null;
  celebrate: (c: Celebration) => void;
  dismiss: () => void;
}

export const useCelebrationStore = create<CelebrationState>()((set) => ({
  current: null,
  celebrate: (current) => set({ current }),
  dismiss: () => set({ current: null }),
}));
