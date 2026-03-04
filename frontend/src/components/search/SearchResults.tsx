'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TranslationCard } from '@/components/translator/TranslationCard';
import { WordDetails } from '@/components/dictionary/WordDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { SaveCardButton } from '@/components/cards/SaveCardButton';
import { useTranslation } from '@/hooks/useTranslation';
import { useDictionary } from '@/hooks/useDictionary';
import { detectLanguage } from '@/lib/utils';
import type { WordResponse } from '@/types/dictionary';

interface SearchResultsProps {
  query: string;
  onWordClick: (word: string) => void;
  onSaved?: (deckName?: string) => void;
}

function buildCardData(
  word: WordResponse,
  translation: string,
  sourceWord: string,
  isSourceRussian: boolean
) {
  const englishWord = isSourceRussian ? translation : sourceWord;
  const russianTranslation = isSourceRussian ? sourceWord : translation;
  const partOfSpeech = word.part_of_speech ? [word.part_of_speech] : [];

  return {
    cardData: {
      word: englishWord,
      translation: russianTranslation,
      transcription: word.transcription || undefined,
      partOfSpeech,
      definitions: word.definitions,
      examples: word.examples,
      synonyms: word.synonyms,
    },
    suggestedTags: partOfSpeech,
  };
}

export function SearchResults({ query, onWordClick, onSaved }: SearchResultsProps) {
  const lang = detectLanguage(query);

  const translationQuery = useTranslation(query);
  const englishWord =
    lang === 'en'
      ? query
      : (translationQuery.data?.translatedText ?? '');

  const dictionaryQuery = useDictionary(query, englishWord || undefined);

  if (!query.trim()) return null;

  const isLoading = translationQuery.isLoading;
  const hasError = translationQuery.isError;

  const entry = dictionaryQuery.data?.[0];
  const isRussian = lang === 'ru';

  const saveProps = translationQuery.data
    ? entry
      ? buildCardData(entry, translationQuery.data.translatedText, query, isRussian)
      : {
          cardData: {
            word: isRussian ? translationQuery.data.translatedText : query,
            translation: isRussian ? query : translationQuery.data.translatedText,
          },
          suggestedTags: [] as string[],
        }
    : null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={query}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        {/* Error state */}
        {hasError && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 p-4 text-sm text-[var(--destructive)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Failed to load translation.</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto gap-1 text-[var(--destructive)]"
              onClick={() => translationQuery.refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        )}

        {/* Translation */}
        {isLoading && !translationQuery.data ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-56" />
          </div>
        ) : translationQuery.data ? (
          <TranslationCard result={translationQuery.data} />
        ) : null}

        {/* Dictionary */}
        {dictionaryQuery.isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
        )}

        {dictionaryQuery.data && dictionaryQuery.data.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <WordDetails
              entry={dictionaryQuery.data[0]!}
              onWordClick={onWordClick}
            />
          </div>
        )}

        {/* Save button */}
        {saveProps && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <SaveCardButton
              cardData={saveProps.cardData}
              suggestedTags={saveProps.suggestedTags}
              onSaved={onSaved}
            />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
