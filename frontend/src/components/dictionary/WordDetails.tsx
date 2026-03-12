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
  travel:     'bg-sky-100/60 text-sky-700/70 dark:bg-sky-900/20 dark:text-sky-400/60',
  business:   'bg-indigo-100/60 text-indigo-700/70 dark:bg-indigo-900/20 dark:text-indigo-400/60',
  food:       'bg-orange-100/60 text-orange-700/70 dark:bg-orange-900/20 dark:text-orange-400/60',
  technology: 'bg-cyan-100/60 text-cyan-700/70 dark:bg-cyan-900/20 dark:text-cyan-400/60',
  nature:     'bg-green-100/60 text-green-700/70 dark:bg-green-900/20 dark:text-green-400/60',
  health:     'bg-emerald-100/60 text-emerald-700/70 dark:bg-emerald-900/20 dark:text-emerald-400/60',
  emotions:   'bg-pink-100/60 text-pink-700/70 dark:bg-pink-900/20 dark:text-pink-400/60',
  sport:      'bg-red-100/60 text-red-700/70 dark:bg-red-900/20 dark:text-red-400/60',
  education:  'bg-violet-100/60 text-violet-700/70 dark:bg-violet-900/20 dark:text-violet-400/60',
  law:        'bg-slate-100/60 text-slate-600/70 dark:bg-slate-800/30 dark:text-slate-400/60',
  finance:    'bg-yellow-100/60 text-yellow-700/70 dark:bg-yellow-900/20 dark:text-yellow-400/60',
  politics:   'bg-rose-100/60 text-rose-700/70 dark:bg-rose-900/20 dark:text-rose-400/60',
  art:        'bg-purple-100/60 text-purple-700/70 dark:bg-purple-900/20 dark:text-purple-400/60',
  music:      'bg-fuchsia-100/60 text-fuchsia-700/70 dark:bg-fuchsia-900/20 dark:text-fuchsia-400/60',
  science:    'bg-blue-100/60 text-blue-700/70 dark:bg-blue-900/20 dark:text-blue-400/60',
  fashion:    'bg-rose-100/60 text-rose-600/70 dark:bg-rose-900/20 dark:text-rose-400/60',
  family:     'bg-teal-100/60 text-teal-700/70 dark:bg-teal-900/20 dark:text-teal-400/60',
  society:    'bg-amber-100/60 text-amber-700/70 dark:bg-amber-900/20 dark:text-amber-400/60',
  religion:   'bg-stone-100/60 text-stone-600/70 dark:bg-stone-800/30 dark:text-stone-400/60',
  home:       'bg-lime-100/60 text-lime-700/70 dark:bg-lime-900/20 dark:text-lime-400/60',
  animals:    'bg-green-100/60 text-green-600/70 dark:bg-green-900/20 dark:text-green-400/60',
  weather:    'bg-sky-100/60 text-sky-600/70 dark:bg-sky-900/20 dark:text-sky-400/60',
  time:       'bg-gray-100/60 text-gray-600/70 dark:bg-gray-800/30 dark:text-gray-400/60',
  body:       'bg-pink-100/60 text-pink-600/70 dark:bg-pink-900/20 dark:text-pink-400/60',
  culture:    'bg-purple-100/60 text-purple-600/70 dark:bg-purple-900/20 dark:text-purple-400/60',
  formal:     'bg-slate-100/60 text-slate-600/70 dark:bg-slate-800/30 dark:text-slate-400/60',
  informal:   'bg-orange-100/60 text-orange-600/70 dark:bg-orange-900/20 dark:text-orange-400/60',
  slang:      'bg-yellow-100/60 text-yellow-700/70 dark:bg-yellow-900/20 dark:text-yellow-400/60',
  academic:   'bg-indigo-100/60 text-indigo-600/70 dark:bg-indigo-900/20 dark:text-indigo-400/60',
  literary:   'bg-violet-100/60 text-violet-600/70 dark:bg-violet-900/20 dark:text-violet-400/60',
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
