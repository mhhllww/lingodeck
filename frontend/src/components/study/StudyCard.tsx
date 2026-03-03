'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimationControls } from 'framer-motion';
import { Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSpeech } from '@/hooks/useSpeech';
import type { VocabularyCard } from '@/types/card';

const SWIPE_THRESHOLD = 120;
const DRAG_MAX = 300;

interface StudyCardProps {
  card: VocabularyCard;
  onGotIt: () => void;
  onAgain: () => void;
}

export function StudyCard({ card, onGotIt, onAgain }: StudyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const isDragging = useRef(false);
  const { speak, isSpeaking, isSupported } = useSpeech();

  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-DRAG_MAX, 0, DRAG_MAX], [-20, 0, 20]);
  const y = useTransform(x, (v) => (v * v) * 60 / (DRAG_MAX * DRAG_MAX));
  const boxShadow = useTransform(x, (v) =>
    v >= 0
      ? `0px 0px ${v * 0.12}px ${v * 0.04}px rgba(34,197,94,${Math.min(v / SWIPE_THRESHOLD, 1) * 0.15})`
      : `0px 0px ${Math.abs(v) * 0.12}px ${Math.abs(v) * 0.04}px rgba(239,68,68,${Math.min(Math.abs(v) / SWIPE_THRESHOLD, 1) * 0.15})`
  );
  const opacity = useTransform(x, [-DRAG_MAX, 0, DRAG_MAX], [0.5, 1, 0.5]);

  const handleFlip = () => {
    if (!isDragging.current) setIsFlipped((prev) => !prev);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {/* Left arrow — Again */}
        <button
          onClick={onAgain}
          className={`shrink-0 w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400 transition-opacity duration-150 ${(!isFlipped || isDraggingState) ? 'opacity-0 pointer-events-none' : 'opacity-60'}`}
          aria-label="Again"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Card area */}
        <div className="flex-1" style={{ height: '320px', position: 'relative' }}>
        {/* Draggable wrapper — drag only active on back side */}
        <motion.div
        animate={controls}
        drag={isFlipped ? 'x' : false}
        dragConstraints={{ left: -300, right: 300 }}
        dragElastic={0}
        dragMomentum={false}
        style={{ x, y, rotate, boxShadow, opacity, borderRadius: '1rem', position: 'absolute', inset: 0 }}
        onDragStart={() => { isDragging.current = true; setIsDraggingState(true); }}
        onDragEnd={async (_, info) => {
          setTimeout(() => { isDragging.current = false; }, 50);
          if (info.offset.x > SWIPE_THRESHOLD) {
            await controls.start({ opacity: 0, transition: { duration: 0.15 } });
            onGotIt();
          } else if (info.offset.x < -SWIPE_THRESHOLD) {
            await controls.start({ opacity: 0, transition: { duration: 0.15 } });
            onAgain();
          } else {
            setIsDraggingState(false);
            controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
          }
        }}
      >
        {/* Flip card */}
        <div style={{ perspective: '1000px', width: '100%', height: '100%' }}>
          <motion.div
            className="relative w-full h-full cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            onClick={handleFlip}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 flex flex-col justify-between"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-[var(--foreground)]">{card.word}</span>
                  {isSupported && (
                    <button
                      onClick={(e) => { e.stopPropagation(); speak(card.word); }}
                      className="text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                      aria-label={`Pronounce ${card.word}`}
                    >
                      <Volume2 className={`h-5 w-5 ${isSpeaking ? 'text-[var(--accent)]' : ''}`} />
                    </button>
                  )}
                </div>
                {card.transcription && (
                  <p className="text-base text-[var(--muted-foreground)] font-mono">
                    {card.transcription}
                  </p>
                )}
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Tap to reveal translation</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] p-8 flex flex-col justify-between overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="space-y-3 overflow-hidden">
                <p className="text-2xl font-bold text-[var(--accent)]">{card.translation}</p>

                {card.partOfSpeech && card.partOfSpeech.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {card.partOfSpeech.map((pos) => (
                      <Badge key={pos} variant="outline" className="text-xs">
                        {pos}
                      </Badge>
                    ))}
                  </div>
                )}

                {card.definitions && card.definitions.length > 0 && (
                  <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                    {card.definitions[0]}
                  </p>
                )}
                {card.definitions && card.definitions[1] && (
                  <p className="text-sm text-[var(--muted-foreground)] line-clamp-1">
                    {card.definitions[1]}
                  </p>
                )}

                {card.examples && card.examples.length > 0 && (
                  <p className="text-sm italic text-[var(--muted-foreground)] line-clamp-2 border-l-2 border-[var(--border)] pl-3">
                    &ldquo;{card.examples[0]}&rdquo;
                  </p>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      </motion.div>
        </div>

        {/* Right arrow — Got it */}
        <button
          onClick={onGotIt}
          className={`shrink-0 w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-emerald-400 transition-opacity duration-150 ${(!isFlipped || isDraggingState) ? 'opacity-0 pointer-events-none' : 'opacity-60'}`}
          aria-label="Got it"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-xs text-[var(--muted-foreground)]" style={{ opacity: 0.4 }}>
        {isFlipped ? 'Swipe right — got it · swipe left — repeat' : 'Tap to reveal the answer'}
      </p>
    </div>
  );
}
