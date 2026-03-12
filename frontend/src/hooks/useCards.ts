'use client';

import { useCardStore } from '@/store/useCardStore';
import { useAllCards, useDeleteCard, useUpdateCard } from './useCardsQuery';
import type { VocabularyCard, CardFilters } from '@/types/card';

function applyFilters(cards: VocabularyCard[], filters: CardFilters): VocabularyCard[] {
  let result = [...cards];

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (c) =>
        c.word.toLowerCase().includes(q) ||
        c.translation.toLowerCase().includes(q)
    );
  }

  if (filters.deckIds.length > 0) {
    const ids = new Set(filters.deckIds);
    result = result.filter((c) =>
      ids.has('none')
        ? !c.deckId || (c.deckId != null && ids.has(c.deckId))
        : c.deckId != null && ids.has(c.deckId)
    );
  }

  if (filters.tags.length > 0) {
    result = result.filter((c) =>
      filters.tags.some((tag) => c.tags?.includes(tag))
    );
  }

  result.sort((a, b) => {
    const fieldA = a[filters.sortField] ?? '';
    const fieldB = b[filters.sortField] ?? '';
    const cmp = fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
    return filters.sortOrder === 'desc' ? -cmp : cmp;
  });

  return result;
}

export function useCards() {
  const { data: allCards = [] } = useAllCards();
  const filters = useCardStore((s) => s.filters);
  const setFilters = useCardStore((s) => s.setFilters);
  const deleteCardMutation = useDeleteCard();
  const updateCardMutation = useUpdateCard();

  return {
    cards: applyFilters(allCards, filters),
    allCards,
    filters,
    setFilters,
    deleteCard: (id: string) => deleteCardMutation.mutate(id),
    updateCard: (id: string, data: Partial<VocabularyCard>) =>
      updateCardMutation.mutate({ id, data }),
  };
}

export function useCardById(id: string): VocabularyCard | undefined {
  const { data: allCards = [] } = useAllCards();
  return allCards.find((c) => c.id === id);
}
