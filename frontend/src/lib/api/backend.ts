import type { VocabularyCard, Deck } from '@/types/card';

// ── Backend shapes (as returned by the real API) ──────────

interface BackendCard {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  example?: string;
  transcription?: string;
  part_of_speech?: string | string[];
  definitions?: string[];
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  tags?: string[];
  times_correct?: number;
  times_incorrect?: number;
  last_studied_at?: string;
  created_at: string;
  difficulty?: number;
}

interface BackendDeck {
  id: number;
  name: string;
  description?: string;
  color?: string;
  tags?: string[];
  card_count?: number;
  created_at: string;
}

// ── Type mapping ──────────────────────────────────────────

const FALLBACK_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
] as const;

export function mapCard(c: BackendCard): VocabularyCard {
  const pos = c.part_of_speech;
  return {
    id: String(c.id),
    deckId: String(c.deck_id),
    word: c.front,
    translation: c.back,
    transcription: c.transcription,
    partOfSpeech: pos
      ? Array.isArray(pos) ? pos : [pos]
      : undefined,
    definitions: c.definitions,
    examples: c.examples ?? (c.example ? [c.example] : undefined),
    synonyms: c.synonyms,
    antonyms: c.antonyms,
    tags: c.tags ?? [],
    timesCorrect: c.times_correct ?? 0,
    timesIncorrect: c.times_incorrect ?? 0,
    lastStudiedAt: c.last_studied_at,
    createdAt: c.created_at,
  };
}

export function mapDeck(d: BackendDeck, colorIndex = 0): Deck {
  return {
    id: String(d.id),
    name: d.name,
    color: d.color ?? FALLBACK_COLORS[colorIndex % FALLBACK_COLORS.length],
    tags: d.tags ?? [],
    createdAt: d.created_at,
  };
}

// ── HTTP helper ───────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${path}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Decks ─────────────────────────────────────────────────

export async function apiGetDecks(): Promise<Deck[]> {
  const data = await request<BackendDeck[]>('/api/decks');
  return data.map((d, i) => mapDeck(d, i));
}

export async function apiCreateDeck(name: string): Promise<Deck> {
  const d = await request<BackendDeck>('/api/decks', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return mapDeck(d);
}

export async function apiUpdateDeck(id: string, name: string): Promise<Deck> {
  const d = await request<BackendDeck>(`/api/decks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
  return mapDeck(d);
}

export async function apiDeleteDeck(id: string): Promise<void> {
  await request<void>(`/api/decks/${id}`, { method: 'DELETE' });
}

// ── Cards ─────────────────────────────────────────────────

export async function apiGetDeckCards(deckId: string): Promise<VocabularyCard[]> {
  const data = await request<BackendCard[]>(`/api/decks/${deckId}/cards`);
  return data.map(mapCard);
}

export async function apiCreateCard(
  deckId: string,
  data: Omit<VocabularyCard, 'id' | 'createdAt' | 'deckId'>,
): Promise<VocabularyCard> {
  const c = await request<BackendCard>(`/api/decks/${deckId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ front: data.word, back: data.translation }),
  });
  return mapCard(c);
}

export async function apiUpdateCard(
  id: string,
  data: Partial<VocabularyCard>,
): Promise<VocabularyCard> {
  const body: Record<string, unknown> = {};
  if (data.word !== undefined) body.front = data.word;
  if (data.translation !== undefined) body.back = data.translation;
  if (data.timesCorrect !== undefined) body.times_correct = data.timesCorrect;
  if (data.timesIncorrect !== undefined) body.times_incorrect = data.timesIncorrect;
  if (data.lastStudiedAt !== undefined) body.last_studied_at = data.lastStudiedAt;

  const c = await request<BackendCard>(`/api/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return mapCard(c);
}

export async function apiDeleteCard(id: string): Promise<void> {
  await request<void>(`/api/cards/${id}`, { method: 'DELETE' });
}
