import { fetchWithAuth } from './fetchWithAuth';
import { mapCard } from './backend';
import type { VocabularyCard } from '@/types/card';

export interface WordOfTheDayData {
  word: string;
  translation: string;
  transcription: string;
  part_of_speech: string;
  definition: string;
  suggested_deck: { id: number; name: string } | null;
  already_added: boolean;
}

export interface DailyMixData {
  cards: VocabularyCard[];
  progress: { done: number; total: number };
}

export async function fetchWordOfTheDay(): Promise<WordOfTheDayData> {
  const res = await fetchWithAuth('/api/daily/word-of-the-day');
  if (!res.ok) throw new Error(`Word of the day error: ${res.status}`);
  return res.json();
}

export async function addWordOfTheDayToDeck(deckId: number): Promise<VocabularyCard> {
  const res = await fetchWithAuth('/api/daily/word-of-the-day/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deck_id: deckId }),
  });
  if (!res.ok) throw new Error(`Add word of the day error: ${res.status}`);
  const data = await res.json();
  return mapCard(data as Parameters<typeof mapCard>[0]);
}

export async function fetchDailyMix(): Promise<DailyMixData> {
  const res = await fetchWithAuth('/api/daily/mix');
  if (!res.ok) throw new Error(`Daily mix error: ${res.status}`);
  const data = await res.json();
  return {
    cards: (data.cards ?? []).map((c: Parameters<typeof mapCard>[0]) => mapCard(c)),
    progress: data.progress,
  };
}
