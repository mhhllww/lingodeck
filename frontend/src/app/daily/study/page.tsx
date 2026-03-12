'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/study/ProgressBar';
import { StudyCard } from '@/components/study/StudyCard';
import { SessionResults } from '@/components/study/SessionResults';
import { useStudySession } from '@/hooks/useStudySession';
import { useBulkUpdateStudyStats } from '@/hooks/useCardsQuery';
import { useDailyStudyStore } from '@/store/useDailyStudyStore';
import { saveStudyResults } from '@/lib/api/cards';

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

export default function DailyStudyPage() {
  const router = useRouter();
  const { cards, clear } = useDailyStudyStore();
  const bulkUpdateStudyStats = useBulkUpdateStudyStats();
  const queryClient = useQueryClient();

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
  const statsApplied = useRef(false);

  useEffect(() => {
    if (cards.length > 0) {
      start(cards);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'results' && !statsApplied.current) {
      statsApplied.current = true;
      bulkUpdateStudyStats(gotIt.map((c) => c.id), againCounts);

      // Build results for backend
      const results: { card_id: string; correct: boolean }[] = [
        ...gotIt.map((c) => ({ card_id: c.id, correct: true })),
        ...Object.entries(againCounts).map(([id]) => ({ card_id: id, correct: false })),
      ];

      // Save to backend, then refetch daily-mix with updated last_studied_at
      saveStudyResults(results)
        .then(() => queryClient.invalidateQueries({ queryKey: ['daily-mix'] }))
        .catch(() => queryClient.invalidateQueries({ queryKey: ['daily-mix'] }));
    }
    if (phase !== 'results') statsApplied.current = false;
  }, [phase, gotIt, againCounts, bulkUpdateStudyStats, queryClient]);

  const handleGotIt = useCallback(() => {
    setCardKey((k) => k + 1);
    markGotIt();
  }, [markGotIt]);

  const handleAgain = useCallback(() => {
    setCardKey((k) => k + 1);
    markAgain();
  }, [markAgain]);

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

  function handleExit() {
    clear();
    router.push('/');
  }

  if (cards.length === 0 && phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-[var(--muted-foreground)]">No cards in daily mix.</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          Back
        </Button>
      </div>
    );
  }

  if (phase === 'results') {
    const totalAgainPresses = Object.values(againCounts).reduce((sum, n) => sum + n, 0);
    return (
      <SessionResults
        gotIt={gotIt}
        againHistory={againHistory}
        totalCards={totalCards}
        totalAgainPresses={totalAgainPresses}
        onStudyAgain={restartWithAgain}
        onBackToDeck={() => { clear(); router.push('/'); }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="max-w-md mx-auto space-y-6 px-2"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
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
                  <p className="text-xs text-[var(--foreground)]">Exit session? Progress will be lost.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={handleExit}>
                      Exit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setShowExitConfirm(false)}>
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="text-xs text-[var(--muted-foreground)]">Daily Mix</span>
        </div>

        <ProgressBar value={gotIt.length} max={totalCards} />
      </div>

      <AnimatePresence mode="wait">
        {currentCard && (
          <motion.div
            key={`${currentCard.id}-${cardKey}`}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <StudyCard card={currentCard} onGotIt={handleGotIt} onAgain={handleAgain} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
