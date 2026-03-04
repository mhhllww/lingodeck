export interface TranslationResult {
  translatedText: string;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
}


export type Language = {
  code: string;
  name: string;
  flag?: string;
};

export type LangPair = `${string}|${string}`;
