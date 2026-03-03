'use client';

import { useCardStore } from '@/store/useCardStore';
import type { VocabularyCard } from '@/types/card';

export function useCards() {
  const store = useCardStore();
  const cards = store.getFilteredCards();

  return {
    cards,
    allCards: store.cards,
    filters: store.filters,
    addCard: store.addCard,
    updateCard: store.updateCard,
    deleteCard: store.deleteCard,
    setFilters: store.setFilters,
  };
}

export function useCardById(id: string): VocabularyCard | undefined {
  return useCardStore((state) => state.cards.find((c) => c.id === id));
}
