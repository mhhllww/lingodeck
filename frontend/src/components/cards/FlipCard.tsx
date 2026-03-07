'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Trash2, Edit2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSpeech } from '@/hooks/useSpeech';
import type { VocabularyCard } from '@/types/card';

interface FlipCardProps {
  card: VocabularyCard;
  onDelete: (id: string) => void;
  onEdit: (card: VocabularyCard) => void;
  onAssignDeck?: (card: VocabularyCard) => void;
}

export function FlipCard({ card, onDelete, onEdit, onAssignDeck }: FlipCardProps) {
  const [rotation, setRotation] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { speak, isSpeaking, isSupported } = useSpeech();
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlipped = rotation % 360 !== 0;

  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
    flipTimer.current = setTimeout(() => setRotation((r) => r + 180), 500);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowControls(false);
    if (flipTimer.current) {
      clearTimeout(flipTimer.current);
      flipTimer.current = null;
    }
    flipTimer.current = setTimeout(() => {
      setRotation((r) => r % 360 !== 0 ? r + 180 : r);
    }, 500);
  }, []);

  return (
    <div
      className="relative"
      style={{ perspective: '1000px', height: '220px' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Controls overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls && !isAnimating ? 1 : 0 }}
        className="absolute top-2 right-2 z-20 flex gap-1"
        data-no-flip="true"
      >
        {onAssignDeck && (
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); onAssignDeck(card); }}
            aria-label="Move to deck"
            data-no-flip="true"
          >
            <Layers className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="secondary"
          size="icon-sm"
          onClick={(e) => { e.stopPropagation(); onEdit(card); }}
          aria-label="Edit card"
          data-no-flip="true"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          variant="destructive"
          size="icon-sm"
          onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
          aria-label="Delete card"
          data-no-flip="true"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </motion.div>

      {/* Card */}
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: rotation }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={() => setIsAnimating(false)}
        role="group"
        aria-label={`Vocabulary card: ${card.word}`}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[var(--foreground)]">{card.word}</span>
              {isSupported && card.transcription && (
                <button
                  data-no-flip="true"
                  onClick={(e) => { e.stopPropagation(); speak(card.word); }}
                  className="text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                  aria-label={`Pronounce ${card.word}`}
                >
                  <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-[var(--accent)]' : ''}`} />
                </button>
              )}
            </div>
            {card.transcription && (
              <p className="text-sm text-[var(--muted-foreground)] font-mono">{card.transcription}</p>
            )}
            {card.partOfSpeech && card.partOfSpeech.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {card.partOfSpeech.map((pos) => (
                  <Badge key={pos} variant="outline" className="text-xs">{pos}</Badge>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">Hover to see translation</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl border border-[var(--accent)]/30 bg-[var(--card)] p-5 flex flex-col justify-between overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="space-y-2 overflow-hidden">
            <p className="text-lg font-semibold text-[var(--accent)]">{card.translation}</p>

            {card.definitions && card.definitions.length > 0 && (
              <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                {card.definitions[0]}
              </p>
            )}

            {card.examples && card.examples.length > 0 && (
              <p className="text-xs italic text-[var(--muted-foreground)] line-clamp-2 border-l-2 border-[var(--border)] pl-2">
                "{card.examples[0]}"
              </p>
            )}

            {card.synonyms && card.synonyms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {card.synonyms.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">Move cursor away to see word</p>
        </div>
      </motion.div>
    </div>
  );
}
