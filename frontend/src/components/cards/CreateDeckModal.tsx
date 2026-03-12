'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DECK_COLORS } from '@/store/useCardStore';
import { useDecks, useCreateDeck } from '@/hooks/useCardsQuery';
import { cn } from '@/lib/utils';
import type { Deck } from '@/types/card';

function randomColor(): string {
  return DECK_COLORS[Math.floor(Math.random() * DECK_COLORS.length)];
}

interface CreateDeckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (deck: Deck) => void;
}

export function CreateDeckModal({ open, onOpenChange, onCreated }: CreateDeckModalProps) {
  const { data: decks = [] } = useDecks();
  const createDeck = useCreateDeck();
  const [name, setName] = useState('');
  const [color, setColor] = useState(randomColor);
  const [customColor, setCustomColor] = useState('');

  const customRafRef = useRef<number>(0);
  const customLatestRef = useRef('');

  const handleCustomInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    customLatestRef.current = (e.target as HTMLInputElement).value;
    if (!customRafRef.current) {
      customRafRef.current = requestAnimationFrame(() => {
        setCustomColor(customLatestRef.current);
        customRafRef.current = 0;
      });
    }
  }, []);

  const isCustom = !!customColor && !DECK_COLORS.includes(customColor as typeof DECK_COLORS[number]);
  const activeColor = customColor || color;

  const nameExists = useMemo(
    () => decks.some((d) => d.name.toLowerCase() === name.trim().toLowerCase()),
    [decks, name]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || nameExists) return;
    const deck = await createDeck.mutateAsync({ name: trimmed, tags: [], color: activeColor });
    onCreated?.(deck);
    onOpenChange(false);
    setName('');
    setColor(randomColor());
    setCustomColor('');
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setName('');
      setColor(randomColor());
      setCustomColor('');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
                    New Deck
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <X className="h-4 w-4" />
                    </Button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--foreground)]">
                      Deck name <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Business English"
                      required
                      autoFocus
                    />
                    {nameExists && (
                      <p className="text-xs text-[var(--destructive)]">
                        A deck with this name already exists
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--foreground)]">Color</label>
                    <div className="flex items-center gap-2">
                      {DECK_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setColor(c); setCustomColor(''); }}
                          className={cn(
                            'h-7 w-7 rounded-full transition-all',
                            activeColor === c
                              ? 'ring-2 ring-offset-2 ring-offset-[var(--background)] ring-[var(--foreground)] scale-110'
                              : 'hover:scale-110'
                          )}
                          style={{ backgroundColor: c }}
                          aria-label={`Color ${c}`}
                        />
                      ))}

                      <div className="relative ml-1">
                        <input
                          type="color"
                          defaultValue={color}
                          onInput={handleCustomInput}
                          className="absolute inset-0 opacity-0 cursor-pointer w-7 h-7"
                          title="Pick custom color"
                        />
                        <div
                          className={cn(
                            'h-7 w-7 rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center transition-all pointer-events-none',
                            isCustom && 'ring-2 ring-offset-2 ring-offset-[var(--background)] ring-[var(--foreground)] scale-110 border-solid border-transparent'
                          )}
                          style={isCustom ? { backgroundColor: customColor } : undefined}
                        >
                          {!isCustom && (
                            <span className="text-[var(--muted-foreground)] text-xs font-bold">+</span>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { setColor(randomColor()); setCustomColor(''); }}
                        title="Random color"
                        className="ml-auto"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div
                    className="rounded-lg border border-[var(--border)] p-3 transition-colors"
                    style={{ borderTopColor: activeColor, borderTopWidth: 3 }}
                  >
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {name.trim() || 'Deck name'}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">0 cards</p>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Dialog.Close asChild>
                      <Button variant="outline" className="flex-1" type="button">
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Button type="submit" className="flex-1" disabled={!name.trim() || nameExists}>
                      Create Deck
                    </Button>
                  </div>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
