'use client';

import { Volume2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SynonymsBlock } from './SynonymsBlock';
import { useSpeech } from '@/hooks/useSpeech';
import { MAX_DEFINITIONS, MAX_EXAMPLES, MAX_SYNONYMS } from '@/lib/constants';
import type { WordResponse } from '@/types/dictionary';

const TAG_COLORS: Record<string, string> = {
  travel:     'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  business:   'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  food:       'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  technology: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  nature:     'bg-green-500/15 text-green-600 dark:text-green-400',
  health:     'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  emotions:   'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  sport:      'bg-red-500/15 text-red-600 dark:text-red-400',
  education:  'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  law:        'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  finance:    'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  politics:   'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  art:        'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  music:      'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
  science:    'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  fashion:    'bg-rose-400/15 text-rose-500 dark:text-rose-400',
  family:     'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  society:    'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  religion:   'bg-stone-500/15 text-stone-600 dark:text-stone-400',
  home:       'bg-lime-500/15 text-lime-600 dark:text-lime-400',
  animals:    'bg-green-400/15 text-green-500 dark:text-green-400',
  weather:    'bg-sky-400/15 text-sky-500 dark:text-sky-400',
  time:       'bg-gray-500/15 text-gray-600 dark:text-gray-400',
  body:       'bg-pink-400/15 text-pink-500 dark:text-pink-400',
  culture:    'bg-purple-400/15 text-purple-500 dark:text-purple-400',
  formal:     'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  informal:   'bg-orange-400/15 text-orange-500 dark:text-orange-400',
  slang:      'bg-yellow-400/15 text-yellow-600 dark:text-yellow-400',
  academic:   'bg-indigo-400/15 text-indigo-500 dark:text-indigo-400',
  literary:   'bg-violet-400/15 text-violet-500 dark:text-violet-400',
};

interface WordDetailsProps {
  entry: WordResponse;
  onWordClick?: (word: string) => void;
  isLoading?: boolean;
}

function WordDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  );
}

export function WordDetails({ entry, onWordClick, isLoading }: WordDetailsProps) {
  const { speak, isSpeaking, isSupported } = useSpeech();

  if (isLoading) return <WordDetailsSkeleton />;

  const definitions = entry.definitions.slice(0, MAX_DEFINITIONS);
  const examples = entry.examples.slice(0, MAX_EXAMPLES);
  const synonyms = entry.synonyms.slice(0, MAX_SYNONYMS);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">{entry.word}</h2>
        {entry.transcription && (
          <span className="text-sm text-[var(--muted-foreground)] font-mono">
            {entry.transcription}
          </span>
        )}
        {isSupported && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => speak(entry.word)}
            disabled={isSpeaking}
            aria-label={`Pronounce ${entry.word}`}
          >
            <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-[var(--accent)]' : ''}`} />
          </Button>
        )}
        {entry.part_of_speech && (
          <span className="text-sm font-semibold text-[var(--accent)] italic">
            {entry.part_of_speech}
          </span>
        )}
      </div>

      {definitions.length > 0 && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 space-y-3">
            {definitions.map((def, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-sm text-[var(--foreground)]">
                  <span className="text-[var(--muted-foreground)] mr-2 text-xs font-medium">
                    {idx + 1}.
                  </span>
                  {def}
                </p>
                {examples[idx] && (
                  <p className="text-sm italic text-[var(--muted-foreground)] pl-5 border-l-2 border-[var(--border)]">
                    "{examples[idx]}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {entry.tags?.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide flex items-center gap-1">
            <Tag className="h-3 w-3" />
            Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[tag] ?? 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}
              >
                <span className="opacity-40">#</span>{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {synonyms.length > 0 && (
        <SynonymsBlock synonyms={synonyms} onWordClick={onWordClick} />
      )}
    </motion.div>
  );
}
