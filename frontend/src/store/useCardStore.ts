import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VocabularyCard, Deck, CardFilters } from '@/types/card';
import { generateId } from '@/lib/utils';
import {
  apiGetDecks,
  apiGetAllCards,
  apiCreateDeck,
  apiUpdateDeck,
  apiDeleteDeck,
  apiCreateCard,
  apiUpdateCard,
  apiDeleteCard,
} from '@/lib/api/backend';

const MOCK = process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';

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
  deleteDeck: (id: string, keepCards?: boolean) => void;
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
        deckIds: [],
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
      updateCard: (id, data) => {
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
        if (!MOCK && /^\d+$/.test(id)) apiUpdateCard(id, data).catch(console.error);
      },
      deleteCard: (id) => {
        set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
        if (!MOCK && /^\d+$/.test(id)) apiDeleteCard(id).catch(console.error);
      },
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

        if (filters.deckIds.length > 0) {
          const ids = new Set(filters.deckIds);
          result = result.filter((c) =>
            ids.has('none') ? !c.deckId || (c.deckId != null && ids.has(c.deckId))
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
      updateDeck: (id, data) => {
        set((state) => ({
          decks: state.decks.map((d) => (d.id === id ? { ...d, ...data } : d)),
        }));
        if (!MOCK && /^\d+$/.test(id)) {
          const deck = get().decks.find((d) => d.id === id);
          if (deck) {
            apiUpdateDeck(id, { name: deck.name, color: deck.color, description: deck.description }).catch(console.error);
          }
        }
      },
      deleteDeck: (id, keepCards = false) => {
        set((state) => ({
          decks: state.decks.filter((d) => d.id !== id),
          cards: keepCards
            ? state.cards.map((c) => c.deckId === id ? { ...c, deckId: undefined } : c)
            : state.cards.filter((c) => c.deckId !== id),
        }));
        if (!MOCK) apiDeleteDeck(id, keepCards).catch(console.error);
      },
      setLastUsedDeckId: (id) => set({ lastUsedDeckId: id }),
    }),
    {
      name: 'lingodeck-cards',
      version: 2,
      migrate: (state, version) => {
        const s = state as Record<string, unknown>;
        if (version === 0) {
          return {
            ...s,
            decks: INITIAL_DECKS,
            lastUsedDeckId: null,
            filters: { ...(s.filters as object), deckIds: [] },
          } as unknown as CardStore;
        }
        if (version === 1) {
          const filters = (s.filters ?? {}) as Record<string, unknown>;
          const { deckId: _, ...rest } = filters;
          return {
            ...s,
            filters: { ...rest, deckIds: [] },
          } as unknown as CardStore;
        }
        return state as CardStore;
      },
    }
  )
);

// ── Standalone async helpers (outside Zustand persist) ────

/**
 * Create deck on backend, then update store with real ID.
 * Returns the deck with the real backend ID.
 */
export async function createDeckOnBackend(
  data: Omit<Deck, 'id' | 'createdAt'>
): Promise<Deck> {
  // Optimistic: add to store immediately with temp ID
  const temp = useCardStore.getState().addDeck(data);

  if (MOCK) return temp;

  try {
    const real = await apiCreateDeck(data.name, data.color);
    const finalDeck: Deck = { ...real, color: data.color, tags: data.tags };
    useCardStore.setState((state) => ({
      decks: state.decks.map((d) => (d.id === temp.id ? finalDeck : d)),
    }));
    return finalDeck;
  } catch (e) {
    console.error('Failed to create deck:', e);
    return temp;
  }
}

/**
 * Create card on backend, then update store with real ID.
 */
export async function createCardOnBackend(
  data: Omit<VocabularyCard, 'id' | 'createdAt'>
): Promise<VocabularyCard> {
  const temp = useCardStore.getState().addCard(data);

  if (MOCK) return temp;

  try {
    const real = await apiCreateCard(data.deckId, data);
    useCardStore.setState((state) => ({
      cards: state.cards.map((c) => (c.id === temp.id ? real : c)),
    }));
    return real;
  } catch (e) {
    console.error('Failed to create card:', e);
    return temp;
  }
}

/**
 * Load all decks and cards from the real backend into the store.
 */
export async function loadFromBackend(): Promise<void> {
  const [decks, cards] = await Promise.all([apiGetDecks(), apiGetAllCards()]);
  useCardStore.setState({ decks, cards });
}
