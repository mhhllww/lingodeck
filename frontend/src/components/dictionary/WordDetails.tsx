'use client';

import { Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SynonymsBlock } from './SynonymsBlock';
import { useSpeech } from '@/hooks/useSpeech';
import { MAX_DEFINITIONS, MAX_EXAMPLES, MAX_SYNONYMS } from '@/lib/constants';
import type { WordResponse } from '@/types/dictionary';

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
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {synonyms.length > 0 && (
        <SynonymsBlock synonyms={synonyms} onWordClick={onWordClick} />
      )}
    </motion.div>
  );
}
