import type { TranslationResponse, TranslationResult } from '@/types/translation';

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

export async function translateText(
  text: string,
  langPair: string
): Promise<TranslationResult> {
  const url = new URL(MYMEMORY_URL);
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', langPair);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status}`);
  }

  const data: TranslationResponse = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || 'Translation failed');
  }

  const [sourceLang, targetLang] = langPair.split('|');
  return {
    translatedText: data.responseData.translatedText,
    sourceText: text,
    sourceLang: sourceLang ?? 'en',
    targetLang: targetLang ?? 'ru',
  };
}
