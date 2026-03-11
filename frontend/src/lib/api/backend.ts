import type { VocabularyCard, Deck } from '@/types/card';

// ── Backend shapes (as returned by the real API) ──────────

interface BackendCard {
  id: number;
  deck_id: number | null;
  front: string;
  back: string;
  example?: string;
  transcription?: string;
  part_of_speech?: string | string[];
  definitions?: string[];
  examples?: string[];
  synonyms?: string[];
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
    deckId: c.deck_id != null ? String(c.deck_id) : undefined,
    word: c.front,
    translation: c.back,
    transcription: c.transcription,
    partOfSpeech: pos
      ? Array.isArray(pos) ? pos : [pos]
      : undefined,
    definitions: c.definitions,
    examples: c.examples ?? (c.example ? [c.example] : undefined),
    synonyms: c.synonyms,
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
    description: d.description ?? '',
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

export async function apiCreateDeck(name: string, color?: string): Promise<Deck> {
  const d = await request<BackendDeck>('/api/decks', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
  return mapDeck(d);
}

export async function apiUpdateDeck(
  id: string,
  data: { name?: string; color?: string; description?: string },
): Promise<Deck> {
  const d = await request<BackendDeck>(`/api/decks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return mapDeck(d);
}

export async function apiDeleteDeck(id: string, keepCards = false): Promise<void> {
  const qs = keepCards ? '?keep_cards=true' : '';
  await request<void>(`/api/decks/${id}${qs}`, { method: 'DELETE' });
}

// ── Cards ─────────────────────────────────────────────────

export async function apiGetDeckCards(deckId: string): Promise<VocabularyCard[]> {
  const data = await request<BackendCard[]>(`/api/decks/${deckId}/cards`);
  return data.map(mapCard);
}

export async function apiGetAllCards(): Promise<VocabularyCard[]> {
  const data = await request<BackendCard[]>('/api/cards');
  return data.map(mapCard);
}

export async function apiCreateCard(
  deckId: string | undefined,
  data: Omit<VocabularyCard, 'id' | 'createdAt' | 'deckId'>,
): Promise<VocabularyCard> {
  const body: Record<string, unknown> = {
    front: data.word,
    back: data.translation,
    transcription: data.transcription ?? '',
    part_of_speech: data.partOfSpeech ?? [],
    definitions: data.definitions ?? [],
    examples: data.examples ?? [],
    synonyms: data.synonyms ?? [],
    tags: data.tags ?? [],
  };
  if (deckId) body.deck_id = Number(deckId);
  const c = await request<BackendCard>('/api/cards', {
    method: 'POST',
    body: JSON.stringify(body),
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
  if (data.transcription !== undefined) body.transcription = data.transcription;
  if (data.partOfSpeech !== undefined) body.part_of_speech = data.partOfSpeech;
  if (data.definitions !== undefined) body.definitions = data.definitions;
  if (data.examples !== undefined) body.examples = data.examples;
  if (data.synonyms !== undefined) body.synonyms = data.synonyms;
  if (data.tags !== undefined) body.tags = data.tags;
  if (data.deckId !== undefined) body.deck_id = Number(data.deckId);
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
