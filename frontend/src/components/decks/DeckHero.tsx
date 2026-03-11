'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, BookOpen, BarChart3, Clock, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import type { Deck, VocabularyCard } from '@/types/card';

interface DeckHeroProps {
  deck: Deck;
  deckCards: VocabularyCard[];
  onUpdateDeck: (data: Partial<Omit<Deck, 'id' | 'createdAt'>>) => void;
  onStudy: () => void;
  onBack: () => void;
}

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function DeckHero({ deck, deckCards, onUpdateDeck, onStudy, onBack }: DeckHeroProps) {
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState(deck.name);
  const [descValue, setDescValue] = useState(deck.description ?? '');
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setNameValue(deck.name); }, [deck.name]);
  useEffect(() => { setDescValue(deck.description ?? ''); }, [deck.description]);

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);
  useEffect(() => {
    if (editingDesc) descRef.current?.focus();
  }, [editingDesc]);

  const saveName = useCallback(() => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== deck.name) {
      onUpdateDeck({ name: trimmed });
    } else {
      setNameValue(deck.name);
    }
    setEditingName(false);
  }, [nameValue, deck.name, onUpdateDeck]);

  const saveDesc = useCallback(() => {
    const trimmed = descValue.trim();
    if (trimmed !== (deck.description ?? '')) {
      onUpdateDeck({ description: trimmed });
    }
    setEditingDesc(false);
  }, [descValue, deck.description, onUpdateDeck]);

  const stats = useMemo(() => {
    const total = deckCards.length;
    const studied = deckCards.filter((c) => c.lastStudiedAt).length;
    const lastStudied = deckCards.reduce<string | null>((latest, c) => {
      if (!c.lastStudiedAt) return latest;
      if (!latest) return c.lastStudiedAt;
      return c.lastStudiedAt > latest ? c.lastStudiedAt : latest;
    }, null);
    return { total, studied, lastStudied };
  }, [deckCards]);

  const progressPct = stats.total > 0 ? Math.round((stats.studied / stats.total) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)]">
      {/* Gradient banner */}
      <div
        className="h-32 sm:h-36"
        style={{
          background: `linear-gradient(135deg, ${deck.color} 0%, color-mix(in srgb, ${deck.color} 60%, black) 100%)`,
        }}
      >
        {/* Top row: back + color picker + study */}
        <div className="flex items-center justify-between px-4 pt-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Back to decks"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <ColorPicker
              value={deck.color}
              onChange={(color) => onUpdateDeck({ color })}
            />
            <Button
              size="sm"
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={onStudy}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Study
            </Button>
          </div>
        </div>
      </div>

      {/* Content area overlapping the banner */}
      <div className="relative bg-[var(--background)] px-5 pb-5 -mt-20 pt-10">
        {/* Deck icon */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg -mt-4 mb-3"
          style={{ backgroundColor: deck.color }}
        >
          <Layers className="h-6 w-6 text-white" />
        </div>

        {/* Editable name */}
        <input
          ref={nameRef}
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onFocus={() => setEditingName(true)}
          onBlur={() => { saveName(); setEditingName(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.currentTarget.blur(); }
            if (e.key === 'Escape') { setNameValue(deck.name); setEditingName(false); e.currentTarget.blur(); }
          }}
          className="text-2xl font-bold text-[var(--foreground)] bg-transparent outline-none w-full truncate cursor-pointer border-0 border-b-1 border-transparent pb-[1px] mb-1 focus:border-[var(--primary)]"
        />

        {/* Editable description */}
        <input
          ref={descRef}
          value={descValue}
          onChange={(e) => setDescValue(e.target.value)}
          onFocus={() => setEditingDesc(true)}
          onBlur={() => { saveDesc(); setEditingDesc(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.currentTarget.blur(); }
            if (e.key === 'Escape') { setDescValue(deck.description ?? ''); setEditingDesc(false); e.currentTarget.blur(); }
          }}
          placeholder="Add a description..."
          className="text-sm text-[var(--muted-foreground)] bg-transparent outline-none w-full mb-3 cursor-pointer border-0 border-b-1 border-transparent pb-[1px] focus:border-[var(--primary)]"
        />

        {/* Stats row */}
        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <Layers className="h-3.5 w-3.5" />
            <span className="font-medium text-[var(--foreground)]">{stats.total}</span>
            {stats.total === 1 ? 'card' : 'cards'}
          </div>

          <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="font-medium text-[var(--foreground)]">{progressPct}%</span>
            studied
            {stats.total > 0 && (
              <div className="w-16 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden ml-1">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressPct}%`, backgroundColor: deck.color }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <Clock className="h-3.5 w-3.5" />
            {stats.lastStudied ? formatRelativeDate(stats.lastStudied) : 'Not studied yet'}
          </div>
        </div>
      </div>
    </div>
  );
}
