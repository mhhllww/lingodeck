'use client';

import { useMemo, useState, memo } from 'react';
import { Layers, Check, ChevronDown, Search } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { Deck } from '@/types/card';

/* ── Multi-select (filter) ── */

interface DeckFilterDropdownProps {
  decks: Deck[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export const DeckFilterDropdown = memo(function DeckFilterDropdown({
  decks,
  selectedIds,
  onToggle,
}: DeckFilterDropdownProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return decks;
    const q = search.toLowerCase();
    return decks.filter((d) => d.name.toLowerCase().includes(q));
  }, [decks, search]);

  return (
    <Popover onOpenChange={(o) => { if (!o) setSearch(''); }}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors">
          <Layers className="h-3.5 w-3.5 opacity-50" />
          {selectedIds.length === 0 ? 'All decks' : `${selectedIds.length} selected`}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-0">
        <div className="p-1.5 border-b border-[var(--border)]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decks…"
              className="w-full h-7 pl-7 pr-2 text-xs rounded-md bg-[var(--muted)] border-none outline-none placeholder:text-[var(--muted-foreground)]"
            />
          </div>
        </div>
        <div className="p-1 max-h-52 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
          {!search.trim() && (
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-[var(--muted)] transition-colors"
              onClick={() => onToggle('none')}
            >
              <span className={`h-4 w-4 flex items-center justify-center rounded border ${selectedIds.includes('none') ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'}`}>
                {selectedIds.includes('none') && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--border)]" />
              No deck
            </button>
          )}
          {filtered.map((deck) => (
            <button
              key={deck.id}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-[var(--muted)] transition-colors"
              onClick={() => onToggle(deck.id)}
            >
              <span className={`h-4 w-4 flex items-center justify-center rounded border ${selectedIds.includes(deck.id) ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'}`}>
                {selectedIds.includes(deck.id) && <Check className="h-3 w-3 text-white" />}
              </span>
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: deck.color }}
              />
              <span className="truncate">{deck.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-[var(--muted-foreground)] text-center py-2">Nothing found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

/* ── Single-select (pick) ── */

interface DeckPickerDropdownProps {
  decks: Deck[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export const DeckPickerDropdown = memo(function DeckPickerDropdown({
  decks,
  selectedId,
  onSelect,
}: DeckPickerDropdownProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return decks;
    const q = search.toLowerCase();
    return decks.filter((d) => d.name.toLowerCase().includes(q));
  }, [decks, search]);

  const selectedDeck = decks.find((d) => d.id === selectedId);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(''); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <span className="flex items-center gap-2 truncate">
            {selectedDeck ? (
              <>
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedDeck.color }}
                />
                {selectedDeck.name}
              </>
            ) : (
              'No deck'
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="p-1.5 border-b border-[var(--border)]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decks…"
              className="w-full h-7 pl-7 pr-2 text-xs rounded-md bg-[var(--muted)] border-none outline-none placeholder:text-[var(--muted-foreground)]"
            />
          </div>
        </div>
        <div className="p-1 max-h-52 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
          {!search.trim() && (
            <button
              type="button"
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-[var(--muted)] transition-colors"
              onClick={() => { onSelect(null); setOpen(false); }}
            >
              {!selectedId ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--border)]" />
              No deck
            </button>
          )}
          {filtered.map((deck) => (
            <button
              type="button"
              key={deck.id}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-[var(--muted)] transition-colors"
              onClick={() => { onSelect(deck.id); setOpen(false); }}
            >
              {selectedId === deck.id ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: deck.color }}
              />
              <span className="truncate">{deck.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-[var(--muted-foreground)] text-center py-2">Nothing found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
