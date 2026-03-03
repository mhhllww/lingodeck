'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, RotateCcw, ArrowLeft, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useSpeech } from '@/hooks/useSpeech';
import type { VocabularyCard } from '@/types/card';

interface SessionResultsProps {
  gotIt: VocabularyCard[];
  againHistory: VocabularyCard[];
  totalCards: number;
  totalAgainPresses: number;
  onStudyAgain: () => void;
  onBackToDeck: () => void;
}

function CardDetailSheet({
  card,
  open,
  onClose,
}: {
  card: VocabularyCard | null;
  open: boolean;
  onClose: () => void;
}) {
  const { speak, isSpeaking, isSupported } = useSpeech();

  if (!card) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent title={card.word}>
        <div className="p-5 space-y-5">
          {/* Word + TTS */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--foreground)]">{card.word}</span>
              {isSupported && (
                <button
                  onClick={() => speak(card.word)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                >
                  <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-[var(--accent)]' : ''}`} />
                </button>
              )}
            </div>
            {card.transcription && (
              <p className="text-sm text-[var(--muted-foreground)] font-mono">
                {card.transcription}
              </p>
            )}
          </div>

          {/* Translation */}
          <div className="rounded-lg bg-[var(--muted)] p-3">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Translation</p>
            <p className="font-semibold text-[var(--foreground)]">{card.translation}</p>
          </div>

          {/* Part of speech */}
          {card.partOfSpeech && card.partOfSpeech.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.partOfSpeech.map((pos) => (
                <Badge key={pos} variant="outline" className="text-xs">
                  {pos}
                </Badge>
              ))}
            </div>
          )}

          {/* Definitions */}
          {card.definitions && card.definitions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Definitions
              </p>
              {card.definitions.map((def, i) => (
                <p key={i} className="text-sm text-[var(--foreground)]">
                  {i + 1}. {def}
                </p>
              ))}
            </div>
          )}

          {/* Examples */}
          {card.examples && card.examples.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Examples
              </p>
              {card.examples.map((ex, i) => (
                <p key={i} className="text-sm italic text-[var(--muted-foreground)] border-l-2 border-[var(--border)] pl-3">
                  &ldquo;{ex}&rdquo;
                </p>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function SessionResults({
  gotIt,
  againHistory,
  totalCards,
  totalAgainPresses,
  onStudyAgain,
  onBackToDeck,
}: SessionResultsProps) {
  const [sheetCard, setSheetCard] = useState<VocabularyCard | null>(null);
  const gotItCount = gotIt.length;
  const totalAnswers = gotItCount + totalAgainPresses;
  const pct = totalAnswers > 0 ? Math.round((gotItCount / totalAnswers) * 100) : 0;

  return (
    <>
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] px-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-[var(--foreground)]">
              <PartyPopper className="h-6 w-6 text-[var(--accent)]" />
              Session Complete
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              You reviewed {totalCards} {totalCards === 1 ? 'card' : 'cards'}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="flex gap-4">
            <div className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-emerald-500">{gotItCount}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">correct</p>
            </div>
            <div className="flex-1 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{totalAgainPresses}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">retries</p>
            </div>
          </motion.div>

          {/* Progress bar — accuracy: gotIt / (gotIt + retries) */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <div className="h-2.5 rounded-full bg-[var(--muted)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <p className="text-xs text-right text-[var(--muted-foreground)]">
              {gotItCount} correct · {totalAgainPresses} retries · {pct}% accuracy
            </p>
          </motion.div>

          {/* Words to review */}
          {againHistory.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">Words to review:</p>
              <div className="flex flex-wrap gap-1.5">
                {againHistory.map((card) => (
                  <Badge
                    key={card.id}
                    variant="outline"
                    className="cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                    onClick={() => setSheetCard(card)}
                  >
                    {card.word}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div variants={itemVariants} className="flex gap-3">
            {againHistory.length > 0 && (
              <Button className="flex-1 gap-2" onClick={onStudyAgain}>
                <RotateCcw className="h-4 w-4" />
                Study Again
              </Button>
            )}
            <Button
              variant={againHistory.length > 0 ? 'outline' : 'default'}
              className="flex-1 gap-2"
              onClick={onBackToDeck}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Deck
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <CardDetailSheet
        card={sheetCard}
        open={!!sheetCard}
        onClose={() => setSheetCard(null)}
      />
    </>
  );
}
