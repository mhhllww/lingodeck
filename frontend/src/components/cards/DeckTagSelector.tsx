'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Check, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCardStore, DECK_COLORS, createDeckOnBackend } from '@/store/useCardStore';
import { cn } from '@/lib/utils';
import type { Deck } from '@/types/card';

interface DeckTagSelectorProps {
  suggestedTags: string[];
  onSave: (params: { deckId: string | null; tags: string[] }) => void;
  onClose: () => void;
}

export function DeckTagSelector({ suggestedTags, onSave, onClose }: DeckTagSelectorProps) {
  const { decks, lastUsedDeckId } = useCardStore();

  const [inputValue, setInputValue] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(lastUsedDeckId);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const deck = decks.find((d) => d.id === lastUsedDeckId);
    return [...new Set([...(deck?.tags ?? []), ...suggestedTags])];
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const selectedDeck = decks.find((d) => d.id === selectedDeckId) ?? null;

  const filteredDecks = useMemo(() => {
    if (!inputValue.trim()) return decks;
    const q = inputValue.toLowerCase();
    return decks.filter((d) => d.name.toLowerCase().includes(q));
  }, [decks, inputValue]);

  const showCreateOption =
    inputValue.trim().length > 0 &&
    !decks.some((d) => d.name.toLowerCase() === inputValue.trim().toLowerCase());

  const options = [...filteredDecks, ...(showCreateOption ? ['create'] : [])] as (
    | Deck
    | 'create'
  )[];

  const handleSelectDeck = (deck: Deck) => {
    setSelectedDeckId(deck.id);
    setSelectedTags([...new Set([...deck.tags, ...suggestedTags])]);
    setInputValue('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleCreateDeck = async () => {
    console.log('create deck');
    const name = inputValue.trim();
    if (!name) return;
    const color = DECK_COLORS[decks.length % DECK_COLORS.length];
    const deck = await createDeckOnBackend({ name, tags: [], color });
    handleSelectDeck(deck);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < options.length) {
        const opt = options[activeIndex];
        if (opt === 'create') {
          handleCreateDeck();
        } else {
          handleSelectDeck(opt);
        }
      } else {
        handleSave();
      }
    }
  };

  const handleSave = () => {
    onSave({ deckId: selectedDeckId, tags: selectedTags });
  };

  // Available tags to show as chips: deck tags + suggestedTags (deduped)
  const availableTags = useMemo(() => {
    const deckTags = selectedDeck?.tags ?? [];
    return [...new Set([...deckTags, ...suggestedTags])];
  }, [selectedDeck, suggestedTags]);

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Save to deck</p>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedDeck ? selectedDeck.name : 'Search or create deck…'}
          className="h-8 text-sm"
        />
      </div>

      {/* Deck list */}
      {options.length > 0 && (
        <ul
          ref={listRef}
          className="max-h-44 overflow-y-auto py-1"
          role="listbox"
        >
          {options.map((opt, i) => {
            if (opt === 'create') {
              return (
                <li key="create" role="option" aria-selected={activeIndex === i}>
                  <button
                    className={cn(
                      'w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors',
                      activeIndex === i
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                    )}
                    onClick={handleCreateDeck}
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Create deck{' '}
                      <span className="font-semibold">"{inputValue.trim()}"</span>
                    </span>
                  </button>
                </li>
              );
            }

            const isSelected = opt.id === selectedDeckId;
            return (
              <li key={opt.id} role="option" aria-selected={isSelected}>
                <button
                  className={cn(
                    'w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors',
                    activeIndex === i
                      ? 'bg-[var(--muted)]'
                      : 'hover:bg-[var(--muted)]'
                  )}
                  onClick={() => handleSelectDeck(opt)}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="flex-1 font-medium text-[var(--foreground)]">
                    {opt.name}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Tag chips */}
      {availableTags.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted-foreground)] mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isAuto = suggestedTags.includes(tag) && !(selectedDeck?.tags ?? []).includes(tag);
              const isActive = selectedTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={isActive ? 'default' : 'outline'}
                  onClick={() => toggleTag(tag)}
                  className="cursor-pointer gap-1 text-xs"
                >
                  {isAuto && <Sparkles className="h-2.5 w-2.5" />}
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-[var(--border)] flex flex-col gap-2">
        <Button size="sm" className="w-full" onClick={handleSave} disabled={!selectedDeckId}>
          {selectedDeck ? `Save to "${selectedDeck.name}"` : 'Save to Cards'}
        </Button>
        <button
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-center"
          onClick={() => onSave({ deckId: null, tags: selectedTags })}
        >
          or save without a deck
        </button>
      </div>
    </div>
  );
}
