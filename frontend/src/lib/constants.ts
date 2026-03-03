import type { Language } from '@/types/translation';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
];

export const DEFAULT_LANG_PAIR = 'en|ru';
export const DEBOUNCE_MS = 400;

export const QUERY_STALE_TIMES = {
  translation: 10 * 60 * 1000,
  dictionary: 60 * 60 * 1000,
  cards: 0,
};

export const MAX_SYNONYMS = 5;
export const MAX_ANTONYMS = 5;
export const MAX_DEFINITIONS = 3;
export const MAX_EXAMPLES = 2;
