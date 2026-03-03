import type { DictionaryResponse } from '@/types/dictionary';

const DICT_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export async function fetchWordDefinition(word: string): Promise<DictionaryResponse> {
  const response = await fetch(`${DICT_BASE}/${encodeURIComponent(word)}`);

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Dictionary API error: ${response.status}`);
  }

  return response.json();
}
