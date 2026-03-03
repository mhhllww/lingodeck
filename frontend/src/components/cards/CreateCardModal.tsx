'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCards } from '@/hooks/useCards';
import { useToast } from '@/components/ui/toast';
import type { VocabularyCard } from '@/types/card';

interface CreateCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCard?: VocabularyCard;
}

const EMPTY_FORM = {
  word: '',
  translation: '',
  transcription: '',
  tags: '',
};

export function CreateCardModal({ open, onOpenChange, editCard }: CreateCardModalProps) {
  const { addCard, updateCard } = useCards();
  const { toast } = useToast();
  const isEdit = !!editCard;

  const [form, setForm] = useState(
    editCard
      ? {
          word: editCard.word,
          translation: editCard.translation,
          transcription: editCard.transcription ?? '',
          tags: editCard.tags?.join(', ') ?? '',
        }
      : EMPTY_FORM
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.word.trim() || !form.translation.trim()) return;

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (isEdit && editCard) {
      updateCard(editCard.id, {
        word: form.word.trim(),
        translation: form.translation.trim(),
        transcription: form.transcription.trim() || undefined,
        tags,
      });
      toast({ title: 'Card updated', variant: 'success' });
    } else {
      addCard({
        word: form.word.trim(),
        translation: form.translation.trim(),
        transcription: form.transcription.trim() || undefined,
        tags,
      });
      toast({ title: 'Card created', variant: 'success' });
    }

    onOpenChange(false);
    setForm(EMPTY_FORM);
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

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
                    {isEdit ? 'Edit Card' : 'New Card'}
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
                      Word (English) <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <Input
                      value={form.word}
                      onChange={set('word')}
                      placeholder="e.g. ephemeral"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--foreground)]">
                      Translation <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <Input
                      value={form.translation}
                      onChange={set('translation')}
                      placeholder="e.g. кратковременный"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--foreground)]">
                      Transcription
                    </label>
                    <Input
                      value={form.transcription}
                      onChange={set('transcription')}
                      placeholder="e.g. /ɪˈfem.ər.əl/"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--foreground)]">
                      Tags
                    </label>
                    <Input
                      value={form.tags}
                      onChange={set('tags')}
                      placeholder="adjective, advanced (comma-separated)"
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Dialog.Close asChild>
                      <Button variant="outline" className="flex-1" type="button">
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Button type="submit" className="flex-1">
                      {isEdit ? 'Save Changes' : 'Create Card'}
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
