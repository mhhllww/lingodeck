'use client';

import { Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PartOfSpeech } from './PartOfSpeech';
import { useSpeech } from '@/hooks/useSpeech';
import type { DictionaryEntry } from '@/types/dictionary';

interface WordDetailsProps {
  entry: DictionaryEntry;
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

  const audioUrl = entry.phonetics.find((p) => p.audio)?.audio;
  const phonetic = entry.phonetic ?? entry.phonetics.find((p) => p.text)?.text;

  const handleAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => speak(entry.word));
    } else {
      speak(entry.word);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">{entry.word}</h2>
        {phonetic && (
          <span className="text-sm text-[var(--muted-foreground)] font-mono">
            {phonetic}
          </span>
        )}
        {isSupported && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleAudio}
            disabled={isSpeaking}
            aria-label={`Pronounce ${entry.word}`}
          >
            <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-[var(--accent)]' : ''}`} />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {entry.meanings.map((meaning, idx) => (
          <PartOfSpeech
            key={`${meaning.partOfSpeech}-${idx}`}
            meaning={meaning}
            onWordClick={onWordClick}
            defaultOpen={idx === 0}
          />
        ))}
      </div>
    </motion.div>
  );
}
