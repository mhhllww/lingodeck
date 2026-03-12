'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiGetDecks,
  apiCreateDeck,
  apiUpdateDeck,
  apiDeleteDeck,
  apiGetAllCards,
  apiCreateCard,
  apiUpdateCard,
  apiDeleteCard,
} from '@/lib/api/backend';
import type { VocabularyCard, Deck } from '@/types/card';

export const CARDS_KEY = ['cards'] as const;
export const DECKS_KEY = ['decks'] as const;

export function useDecks() {
  return useQuery({ queryKey: DECKS_KEY, queryFn: apiGetDecks });
}

export function useAllCards() {
  return useQuery({ queryKey: CARDS_KEY, queryFn: apiGetAllCards });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<VocabularyCard, 'id' | 'createdAt'>) =>
      apiCreateCard(data.deckId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CARDS_KEY }),
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VocabularyCard> }) =>
      apiUpdateCard(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CARDS_KEY }),
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteCard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CARDS_KEY }),
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Deck, 'id' | 'createdAt'>) => {
      const deck = await apiCreateDeck(data.name, data.color);
      return { ...deck, color: data.color, tags: data.tags };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DECKS_KEY }),
  });
}

export function useUpdateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Deck, 'id' | 'createdAt'>>;
    }) => apiUpdateDeck(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECKS_KEY }),
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, keepCards }: { id: string; keepCards?: boolean }) =>
      apiDeleteDeck(id, keepCards),
    onSuccess: (_, { keepCards }) => {
      qc.invalidateQueries({ queryKey: DECKS_KEY });
      if (!keepCards) qc.invalidateQueries({ queryKey: CARDS_KEY });
    },
  });
}

export function useBulkUpdateStudyStats() {
  const qc = useQueryClient();
  return (gotItIds: string[], againCounts: Record<string, number>) => {
    const now = new Date().toISOString();
    qc.setQueryData<VocabularyCard[]>(CARDS_KEY, (old = []) =>
      old.map((c) => {
        const wasGotIt = gotItIds.includes(c.id);
        const againCount = againCounts[c.id] ?? 0;
        if (!wasGotIt && againCount === 0) return c;
        return {
          ...c,
          lastStudiedAt: now,
          timesCorrect: wasGotIt ? (c.timesCorrect ?? 0) + 1 : c.timesCorrect,
          timesIncorrect:
            againCount > 0
              ? (c.timesIncorrect ?? 0) + againCount
              : c.timesIncorrect,
        };
      })
    );
  };
}
