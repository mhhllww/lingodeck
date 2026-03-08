import { create } from 'zustand';
import type { VocabularyCard } from '@/types/card';

interface DailyStudyStore {
  cards: VocabularyCard[];
  setCards: (cards: VocabularyCard[]) => void;
  clear: () => void;
}

export const useDailyStudyStore = create<DailyStudyStore>((set) => ({
  cards: [],
  setCards: (cards) => set({ cards }),
  clear: () => set({ cards: [] }),
}));
