import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VocabularyCard, Deck, CardFilters } from '@/types/card';
import { generateId } from '@/lib/utils';

export const DECK_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
] as const;

const INITIAL_DECKS: Deck[] = [
  {
    id: 'deck-1',
    name: 'Adjectives',
    tags: ['adjective'],
    color: '#6366f1',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'deck-2',
    name: 'Nouns',
    tags: ['noun'],
    color: '#8b5cf6',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'deck-3',
    name: 'Advanced',
    tags: ['advanced'],
    color: '#10b981',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

interface CardStore {
  // Cards
  cards: VocabularyCard[];
  filters: CardFilters;
  addCard: (card: Omit<VocabularyCard, 'id' | 'createdAt'>) => VocabularyCard;
  updateCard: (id: string, data: Partial<VocabularyCard>) => void;
  deleteCard: (id: string) => void;
  setFilters: (filters: Partial<CardFilters>) => void;
  getFilteredCards: () => VocabularyCard[];

  // Study
  bulkUpdateStudyStats: (
    gotItIds: string[],
    againCounts: Record<string, number>
  ) => void;

  // Decks
  decks: Deck[];
  lastUsedDeckId: string | null;
  addDeck: (data: Omit<Deck, 'id' | 'createdAt'>) => Deck;
  updateDeck: (id: string, data: Partial<Omit<Deck, 'id' | 'createdAt'>>) => void;
  deleteDeck: (id: string) => void;
  setLastUsedDeckId: (id: string | null) => void;
}

export const useCardStore = create<CardStore>()(
  persist(
    (set, get) => ({
      // ── Cards ──────────────────────────────────────────────
      cards: [],
      filters: {
        query: '',
        tags: [],
        sortField: 'createdAt',
        sortOrder: 'desc',
      },
      addCard: (data) => {
        const card: VocabularyCard = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ cards: [card, ...state.cards] }));
        return card;
      },
      updateCard: (id, data) =>
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteCard: (id) =>
        set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),
      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
      getFilteredCards: () => {
        const { cards, filters } = get();
        let result = [...cards];

        if (filters.query) {
          const q = filters.query.toLowerCase();
          result = result.filter(
            (c) =>
              c.word.toLowerCase().includes(q) ||
              c.translation.toLowerCase().includes(q)
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
      },

      // ── Study ──────────────────────────────────────────────
      bulkUpdateStudyStats: (gotItIds, againCounts) => {
        const now = new Date().toISOString();
        set((state) => ({
          cards: state.cards.map((c) => {
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
          }),
        }));
      },

      // ── Decks ──────────────────────────────────────────────
      decks: INITIAL_DECKS,
      lastUsedDeckId: null,
      addDeck: (data) => {
        const deck: Deck = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ decks: [deck, ...state.decks] }));
        return deck;
      },
      updateDeck: (id, data) =>
        set((state) => ({
          decks: state.decks.map((d) => (d.id === id ? { ...d, ...data } : d)),
        })),
      deleteDeck: (id) =>
        set((state) => ({
          decks: state.decks.filter((d) => d.id !== id),
          cards: state.cards.map((c) =>
            c.deckId === id ? { ...c, deckId: undefined } : c
          ),
        })),
      setLastUsedDeckId: (id) => set({ lastUsedDeckId: id }),
    }),
    {
      name: 'lingodeck-cards',
      version: 1,
      migrate: (state, version) => {
        if (version === 0) {
          return {
            ...(state as object),
            decks: INITIAL_DECKS,
            lastUsedDeckId: null,
          } as CardStore;
        }
        return state as CardStore;
      },
    }
  )
);
