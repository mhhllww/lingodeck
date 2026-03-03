'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWordDefinition } from '@/lib/api/dictionary';
import { detectLanguage } from '@/lib/utils';
import { QUERY_STALE_TIMES } from '@/lib/constants';

export function useDictionary(text: string, englishWord?: string) {
  const lang = detectLanguage(text);
  const word = lang === 'en' ? text : (englishWord ?? '');

  return useQuery({
    queryKey: ['dictionary', word],
    queryFn: () => fetchWordDefinition(word),
    staleTime: QUERY_STALE_TIMES.dictionary,
    enabled: word.trim().length > 0,
    retry: 1,
  });
}
