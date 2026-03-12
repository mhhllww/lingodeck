'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeckPickerDropdown } from '@/components/ui/deck-filter-dropdown';
import { useCards } from '@/hooks/useCards';
import { useDecks, useCreateCard } from '@/hooks/useCardsQuery';
import { useToast } from '@/components/ui/toast';
import type { VocabularyCard } from '@/types/card';

interface CreateCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCard?: VocabularyCard;
  deckId?: string;
}

const EMPTY_FORM = {
  word: '',
  translation: '',
  transcription: '',
  tags: '',
};

export function CreateCardModal({ open, onOpenChange, editCard, deckId }: CreateCardModalProps) {
  const { updateCard } = useCards();
  const { data: decks = [] } = useDecks();
  const createCard = useCreateCard();
  const { toast } = useToast();
  const isEdit = !!editCard;

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (editCard) {
      setForm({
        word: editCard.word,
        translation: editCard.translation,
        transcription: editCard.transcription ?? '',
        tags: editCard.tags?.join(', ') ?? '',
      });
      setSelectedDeckId(editCard.deckId ?? null);
    } else {
      setForm(EMPTY_FORM);
      setSelectedDeckId(deckId ?? null);
    }
    setErrors({});
    setSubmitted(false);
  }, [editCard, open, deckId]);

  const validate = (f: typeof EMPTY_FORM) => {
    const e: Partial<typeof EMPTY_FORM> = {};

    if (!f.word.trim()) {
      e.word = 'Word is required';
    } else if (!/^[a-zA-Z\s\-'.]+$/.test(f.word.trim())) {
      e.word = 'Word must be in English (Latin characters only)';
    }

    if (!f.translation.trim()) {
      e.translation = 'Translation is required';
    } else if (!/[\u0400-\u04FF]/.test(f.translation.trim())) {
      e.translation = 'Translation must be in Russian';
    }

    if (f.transcription.trim() && !/^[\x20-\x7Ea-zA-Z\u00C0-\u024F\u0250-\u02FF\u1D00-\u1DBF\/\[\]ˈˌːˑ.\-\s]+$/.test(f.transcription.trim())) {
      e.transcription = 'Invalid transcription characters';
    }

    return e;
  };

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...form, [key]: e.target.value };
    setForm(next);
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

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
        deckId: selectedDeckId ?? undefined,
      });
      toast({ title: 'Card updated', variant: 'success' });
    } else {
      createCard.mutate({
        word: form.word.trim(),
        translation: form.translation.trim(),
        transcription: form.transcription.trim() || undefined,
        tags,
        deckId: selectedDeckId ?? undefined,
      });
      toast({ title: 'Card created', variant: 'success' });
    }

    onOpenChange(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitted(false);
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
                    {isEdit ? 'Edit Card' : 'New Card'}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <X className="h-4 w-4" />
                    </Button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--foreground)]">
                      Word (English) <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <Input
                      value={form.word}
                      onChange={handleChange('word')}
                      placeholder="e.g. ephemeral"
                      autoFocus
                      className={errors.word ? 'border-[var(--destructive)]' : ''}
                    />
                    {errors.word && <p className="text-xs text-[var(--destructive)]">{errors.word}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--foreground)]">
                      Translation <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <Input
                      value={form.translation}
                      onChange={handleChange('translation')}
                      placeholder="e.g. кратковременный"
                      className={errors.translation ? 'border-[var(--destructive)]' : ''}
                    />
                    {errors.translation && <p className="text-xs text-[var(--destructive)]">{errors.translation}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--foreground)]">
                      Transcription
                    </label>
                    <Input
                      value={form.transcription}
                      onChange={handleChange('transcription')}
                      placeholder="e.g. /ɪˈfem.ər.əl/"
                      className={errors.transcription ? 'border-[var(--destructive)]' : ''}
                    />
                    {errors.transcription && <p className="text-xs text-[var(--destructive)]">{errors.transcription}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--foreground)]">
                      Tags
                    </label>
                    <Input
                      value={form.tags}
                      onChange={handleChange('tags')}
                      placeholder="adjective, advanced (comma-separated)"
                    />
                  </div>

                  {decks.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--foreground)]">
                        Deck
                      </label>
                      <DeckPickerDropdown
                        decks={decks}
                        selectedId={selectedDeckId}
                        onSelect={setSelectedDeckId}
                      />
                    </div>
                  )}

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
