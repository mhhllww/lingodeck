import { http, HttpResponse, delay } from 'msw';
import type { VocabularyCard, Deck } from '@/types/card';
import { seedCards, seedDecks } from './data';
import { generateId } from '@/lib/utils';

const CARDS_KEY = 'lingodeck-mock-cards';
const DECKS_KEY = 'lingodeck-mock-decks';

function getCards(): VocabularyCard[] {
  if (typeof localStorage === 'undefined') return [...seedCards];
  const stored = localStorage.getItem(CARDS_KEY);
  if (!stored) {
    localStorage.setItem(CARDS_KEY, JSON.stringify(seedCards));
    return [...seedCards];
  }
  return JSON.parse(stored) as VocabularyCard[];
}

function saveCards(cards: VocabularyCard[]): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  }
}

function getDecks(): Deck[] {
  if (typeof localStorage === 'undefined') return [...seedDecks];
  const stored = localStorage.getItem(DECKS_KEY);
  if (!stored) {
    localStorage.setItem(DECKS_KEY, JSON.stringify(seedDecks));
    return [...seedDecks];
  }
  return JSON.parse(stored) as Deck[];
}

function saveDecks(decks: Deck[]): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  }
}

export const handlers = [
  // ── Cards ──────────────────────────────────────────────────
  http.get('/api/cards', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const search = url.searchParams.get('q') ?? '';
    const deckId = url.searchParams.get('deckId') ?? '';
    let cards = getCards();

    if (search) {
      const q = search.toLowerCase();
      cards = cards.filter(
        (c) =>
          c.word.toLowerCase().includes(q) ||
          c.translation.toLowerCase().includes(q)
      );
    }

    if (deckId) {
      cards = cards.filter((c) => c.deckId === deckId);
    }

    return HttpResponse.json(cards);
  }),

  http.get('/api/cards/:id', async ({ params }) => {
    await delay(200);
    const cards = getCards();
    const card = cards.find((c) => c.id === params.id);
    if (!card) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(card);
  }),

  http.post('/api/cards', async ({ request }) => {
    await delay(300);
    const data = (await request.json()) as Omit<VocabularyCard, 'id' | 'createdAt'>;
    const card: VocabularyCard = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const cards = getCards();
    cards.unshift(card);
    saveCards(cards);
    return HttpResponse.json(card, { status: 201 });
  }),

  http.put('/api/cards/:id', async ({ params, request }) => {
    await delay(300);
    const data = (await request.json()) as Partial<VocabularyCard>;
    const cards = getCards();
    const index = cards.findIndex((c) => c.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    cards[index] = { ...cards[index]!, ...data };
    saveCards(cards);
    return HttpResponse.json(cards[index]);
  }),

  http.delete('/api/cards/:id', async ({ params }) => {
    await delay(200);
    const cards = getCards();
    const filtered = cards.filter((c) => c.id !== params.id);
    saveCards(filtered);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Decks ──────────────────────────────────────────────────
  http.get('/api/decks', async () => {
    await delay(200);
    return HttpResponse.json(getDecks());
  }),

  http.get('/api/decks/:id', async ({ params }) => {
    await delay(200);
    const deck = getDecks().find((d) => d.id === params.id);
    if (!deck) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(deck);
  }),

  http.post('/api/decks', async ({ request }) => {
    await delay(300);
    const data = (await request.json()) as Omit<Deck, 'id' | 'createdAt'>;
    const deck: Deck = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const decks = getDecks();
    decks.unshift(deck);
    saveDecks(decks);
    return HttpResponse.json(deck, { status: 201 });
  }),

  http.put('/api/decks/:id', async ({ params, request }) => {
    await delay(300);
    const data = (await request.json()) as Partial<Deck>;
    const decks = getDecks();
    const index = decks.findIndex((d) => d.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    decks[index] = { ...decks[index]!, ...data };
    saveDecks(decks);
    return HttpResponse.json(decks[index]);
  }),

  http.delete('/api/decks/:id', async ({ params }) => {
    await delay(200);
    const decks = getDecks().filter((d) => d.id !== params.id);
    saveDecks(decks);
    return new HttpResponse(null, { status: 204 });
  }),
];
