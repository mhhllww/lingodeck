'use client';

import { useQuery } from '@tanstack/react-query';
import { translateText } from '@/lib/api/translator';
import { detectLanguage } from '@/lib/utils';
import { QUERY_STALE_TIMES } from '@/lib/constants';

export function useTranslation(text: string) {
  const lang = detectLanguage(text);
  const langPair = lang === 'ru' ? 'ru|en' : 'en|ru';

  return useQuery({
    queryKey: ['translation', text, langPair],
    queryFn: () => translateText(text, langPair),
    staleTime: QUERY_STALE_TIMES.translation,
    enabled: text.trim().length > 0,
    retry: 1,
  });
}
