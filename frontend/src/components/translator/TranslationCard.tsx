'use client';

import { Check, Copy, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSpeech } from '@/hooks/useSpeech';
import { copyToClipboard } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import type { TranslationResult } from '@/types/translation';

interface TranslationCardProps {
  result: TranslationResult;
  isLoading?: boolean;
}

export function TranslationCard({ result, isLoading }: TranslationCardProps) {
  const { speak, isSpeaking, isSupported } = useSpeech();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const englishWord =
    result.sourceLang === 'en' ? result.sourceText : result.translatedText;

  const handleCopy = async () => {
    await copyToClipboard(result.translatedText);
    setCopied(true);
    toast({ title: 'Copied!', variant: 'success', duration: 1500 });
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSpeak = () => {
    speak(englishWord);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
        <div className="h-3 w-24 rounded bg-[var(--muted)] animate-pulse" />
        <div className="h-7 w-48 rounded bg-[var(--muted)] animate-pulse" />
        <div className="h-3 w-36 rounded bg-[var(--muted)] animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1 uppercase tracking-wide">
            {result.sourceLang === 'en' ? 'English → Russian' : 'Russian → English'}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold text-[var(--foreground)] break-words">
              {result.sourceText}
            </span>
            <span className="text-[var(--muted-foreground)]">→</span>
            <span className="text-lg font-semibold text-[var(--accent)] break-words">
              {result.translatedText}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isSupported && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSpeak}
              disabled={isSpeaking}
              aria-label="Pronounce"
              title="Pronounce"
            >
              <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-[var(--accent)]' : ''}`} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            aria-label="Copy translation"
            title="Copy"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
