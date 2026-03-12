import { create } from 'zustand';
import type { CardFilters } from '@/types/card';

export const DECK_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
] as const;

interface CardStore {
  filters: CardFilters;
  lastUsedDeckId: string | null;
  setFilters: (filters: Partial<CardFilters>) => void;
  setLastUsedDeckId: (id: string | null) => void;
}

export const useCardStore = create<CardStore>((set) => ({
  filters: {
    query: '',
    tags: [],
    deckIds: [],
    sortField: 'createdAt',
    sortOrder: 'desc',
  },
  lastUsedDeckId: null,
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setLastUsedDeckId: (id) => set({ lastUsedDeckId: id }),
}));
