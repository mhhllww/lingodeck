'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCardStore, DECK_COLORS, createDeckOnBackend } from '@/store/useCardStore';
import type { Deck } from '@/types/card';

interface CreateDeckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (deck: Deck) => void;
}

export function CreateDeckModal({ open, onOpenChange, onCreated }: CreateDeckModalProps) {
  const { decks } = useCardStore();
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const color = DECK_COLORS[decks.length % DECK_COLORS.length];
    const deck = await createDeckOnBackend({ name: trimmed, tags: [], color });
    onCreated?.(deck);
    onOpenChange(false);
    setName('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Dialog.Close asChild>
                      <Button variant="outline" className="flex-1" type="button">
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Button type="submit" className="flex-1" disabled={!name.trim()}>
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
