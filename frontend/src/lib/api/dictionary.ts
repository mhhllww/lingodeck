import type { WordResponse } from '@/types/dictionary';

export async function fetchWordDefinition(word: string): Promise<WordResponse[]> {
  const response = await fetch(`/api/dictionary/search?q=${encodeURIComponent(word)}`);

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Dictionary API error: ${response.status}`);
  }

  return response.json();
}
