import { create } from 'zustand';

type FloatingPlayerState = {
  enabled: boolean;
  src: string | null;
  title: string;
  animeId: string | null;
  setFloatingPlayer: (payload: { src: string; title: string; animeId: string }) => void;
  clearFloatingPlayer: () => void;
  setEnabled: (enabled: boolean) => void;
};

export const usePlayerStore = create<FloatingPlayerState>((set) => ({
  enabled: false,
  src: null,
  title: '',
  animeId: null,
  setFloatingPlayer: ({ src, title, animeId }) => set({ src, title, animeId, enabled: true }),
  clearFloatingPlayer: () => set({ src: null, title: '', animeId: null, enabled: false }),
  setEnabled: (enabled) => set({ enabled }),
}));
