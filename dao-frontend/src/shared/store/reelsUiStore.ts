import { create } from 'zustand';

/** Lets the floating tab bar know a reel is playing, so it can fade out of the way (and come back when paused). */
interface ReelsUiState {
  playing: boolean;
  setPlaying: (playing: boolean) => void;
}

export const useReelsUiStore = create<ReelsUiState>()((set) => ({
  playing: false,
  setPlaying: (playing) => set({ playing }),
}));
