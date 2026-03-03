'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/study/ProgressBar';
import { SessionStart } from '@/components/study/SessionStart';
import { StudyCard } from '@/components/study/StudyCard';
import { SessionResults } from '@/components/study/SessionResults';
import { useStudySession } from '@/hooks/useStudySession';
import { useCardStore } from '@/store/useCardStore';

// Card transition variants
const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

export default function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { decks, cards, bulkUpdateStudyStats } = useCardStore();

  const deck = decks.find((d) => d.id === id);
  const deckCards = cards.filter((c) => c.deckId === id);

  const {
    phase,
    gotIt,
    againHistory,
    againCounts,
    totalCards,
    currentCard,
    start,
    markGotIt,
    markAgain,
    restartWithAgain,
  } = useStudySession();

  const [cardKey, setCardKey] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Persist stats once when results phase is reached
  const statsApplied = useRef(false);
  useEffect(() => {
    if (phase === 'results' && !statsApplied.current) {
      statsApplied.current = true;
      bulkUpdateStudyStats(gotIt.map((c) => c.id), againCounts);
    }
    if (phase !== 'results') statsApplied.current = false;
  }, [phase, gotIt, againCounts, bulkUpdateStudyStats]);

  const handleGotIt = useCallback(() => {
    setCardKey((k) => k + 1);
    markGotIt();
  }, [markGotIt]);

  const handleAgain = useCallback(() => {
    setCardKey((k) => k + 1);
    markAgain();
  }, [markAgain]);

  // Keyboard shortcuts — G = Got it, A = Again (no flip guard needed)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'studying') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'g' || e.key === 'G') handleGotIt();
      if (e.key === 'a' || e.key === 'A') handleAgain();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleGotIt, handleAgain]);

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-[var(--muted-foreground)]">Deck not found.</p>
        <Button variant="outline" onClick={() => router.push('/decks')}>
          Back to Decks
        </Button>
      </div>
    );
  }

  if (deckCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="font-semibold text-[var(--foreground)]">No cards in this deck</p>
        <p className="text-sm text-[var(--muted-foreground)]">
          Add some cards before starting a study session.
        </p>
        <Button variant="outline" onClick={() => router.push(`/decks/${id}`)}>
          Back to Deck
        </Button>
      </div>
    );
  }

  // ── Start view ───────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <SessionStart
        deck={deck}
        cardCount={deckCards.length}
        onStart={() => start(deckCards)}
        onCancel={() => router.push(`/decks/${id}`)}
      />
    );
  }

  // ── Results view ─────────────────────────────────────────
  if (phase === 'results') {
    const totalAgainPresses = Object.values(againCounts).reduce((sum, n) => sum + n, 0);
    return (
      <SessionResults
        gotIt={gotIt}
        againHistory={againHistory}
        totalCards={totalCards}
        totalAgainPresses={totalAgainPresses}
        onStudyAgain={restartWithAgain}
        onBackToDeck={() => router.push(`/decks/${id}`)}
      />
    );
  }

  // ── Studying view ─────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="max-w-md mx-auto space-y-6 px-2"
    >
      {/* Top bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* Exit button + inline confirm */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-[var(--muted-foreground)]"
              onClick={() => setShowExitConfirm((v) => !v)}
            >
              <X className="h-3.5 w-3.5" />
              Exit
            </Button>

            <AnimatePresence>
              {showExitConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 z-10 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 shadow-lg w-52 space-y-2"
                >
                  <p className="text-xs text-[var(--foreground)]">
                    Exit session? Progress will be lost.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 h-7 text-xs"
                      onClick={() => router.push(`/decks/${id}`)}
                    >
                      Exit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs"
                      onClick={() => setShowExitConfirm(false)}
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Fix 2: progress = gotIt.length / totalCards */}
        <ProgressBar value={gotIt.length} max={totalCards} />
      </div>

      {/* Card with enter/exit animations */}
      <AnimatePresence mode="wait">
        {currentCard && (
          <motion.div
            key={`${currentCard.id}-${cardKey}`}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <StudyCard
              card={currentCard}
              onGotIt={handleGotIt}
              onAgain={handleAgain}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
