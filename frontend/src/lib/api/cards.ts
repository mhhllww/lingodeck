import type { VocabularyCard } from '@/types/card';
import { fetchWithAuth } from './fetchWithAuth';

const BASE = '/api/cards';

export async function fetchCards(params?: Record<string, string>): Promise<VocabularyCard[]> {
  const url = new URL(BASE, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetchWithAuth(url.toString());
  if (!res.ok) throw new Error('Failed to fetch cards');
  return res.json();
}

export async function fetchCard(id: string): Promise<VocabularyCard> {
  const res = await fetchWithAuth(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch card');
  return res.json();
}

export async function createCard(
  data: Omit<VocabularyCard, 'id' | 'createdAt'>
): Promise<VocabularyCard> {
  const res = await fetchWithAuth(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create card');
  return res.json();
}

export async function updateCard(
  id: string,
  data: Partial<VocabularyCard>
): Promise<VocabularyCard> {
  const res = await fetchWithAuth(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update card');
  return res.json();
}

export async function deleteCard(id: string): Promise<void> {
  const res = await fetchWithAuth(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete card');
}
