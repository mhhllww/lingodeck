import type { TranslationResult } from '@/types/translation';

export async function translateText(
  text: string,
  langPair: string
): Promise<TranslationResult> {
  const [sourceLang, targetLang] = langPair.split('|');

  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source_lang: sourceLang, target_lang: targetLang }),
  });

  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    translatedText: data.target_text,
    sourceText: data.source_text,
    sourceLang: data.source_lang,
    targetLang: data.target_lang,
  };
}
