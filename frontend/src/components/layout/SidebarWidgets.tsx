'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, CheckCircle2, PlayCircle, Volume2 } from 'lucide-react';
import { useWordOfTheDay } from '@/hooks/useWordOfTheDay';
import { useDailyMix } from '@/hooks/useDailyMix';
import { useDailyStudyStore } from '@/store/useDailyStudyStore';
import { useAllCards } from '@/hooks/useCardsQuery';
import { SaveCardButton } from '@/components/cards/SaveCardButton';
import { useSpeech } from '@/hooks/useSpeech';

// ── Word of the Day ────────────────────────────────────────

function WordOfTheDayWidget() {
  const { data, isLoading, isError } = useWordOfTheDay();
  const { data: cards = [] } = useAllCards();
  const { speak, isSpeaking, isSupported } = useSpeech();
  const [translationRevealed, setTranslationRevealed] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 space-y-2 animate-pulse">
        <div className="h-3 w-24 rounded bg-[var(--border)]" />
        <div className="h-4 w-16 rounded bg-[var(--border)]" />
        <div className="h-3 w-full rounded bg-[var(--border)]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--accent)]/30 p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[var(--accent)]">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Word of the day</span>
        </div>
        <p className="text-[11px] text-[var(--muted-foreground)]">No word for today yet — check back soon.</p>
      </div>
    );
  }

  // Check locally so deletion immediately reflects
  const isSaved = cards.some((c) => c.word.toLowerCase() === data.word.toLowerCase());

  return (
    <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[var(--accent)]">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Word of the day</span>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[var(--foreground)]">{data.word}</span>
          {isSupported && (
            <button
              onClick={() => speak(data.word)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Pronounce word"
            >
              <Volume2 className={`h-3 w-3 ${isSpeaking ? 'text-[var(--accent)]' : ''}`} />
            </button>
          )}
        </div>
        {data.transcription && (
          <div className="text-[10px] text-[var(--muted-foreground)] font-mono">{data.transcription}</div>
        )}
        {data.part_of_speech && (
          <div className="text-[10px] italic text-[var(--muted-foreground)]">{data.part_of_speech}</div>
        )}
        {data.translation && (
          <button
            onClick={() => setTranslationRevealed((v) => !v)}
            className="mt-1 text-left"
            aria-label={translationRevealed ? 'Hide translation' : 'Reveal translation'}
          >
            {translationRevealed ? (
              <span className="text-[11px] font-medium text-[var(--foreground)]">
                {data.translation}
              </span>
            ) : (
              <span className="text-[10px] text-[var(--accent)] hover:underline transition-colors">
                Tap to check translation
              </span>
            )}
          </button>
        )}
      </div>

      {data.definition && (
        <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2">
          {data.definition}
        </p>
      )}

      {!isSaved && (
        <SaveCardButton
          size="sm"
          cardData={{
            word: data.word,
            translation: data.translation,
            transcription: data.transcription,
            partOfSpeech: data.part_of_speech ? [data.part_of_speech] : undefined,
            definitions: data.definition ? [data.definition] : undefined,
            examples: data.examples?.length ? data.examples : undefined,
            synonyms: data.synonyms?.length ? data.synonyms : undefined,
          }}
          suggestedTags={[]}
        />
      )}
    </div>
  );
}

// ── Daily Mix ──────────────────────────────────────────────

function DailyMixWidget() {
  const { data, isLoading, isError } = useDailyMix();
  const setCards = useDailyStudyStore((s) => s.setCards);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 space-y-2 animate-pulse">
        <div className="h-3 w-20 rounded bg-[var(--border)]" />
        <div className="h-2 w-full rounded-full bg-[var(--border)]" />
        <div className="h-7 w-full rounded-lg bg-[var(--border)]" />
      </div>
    );
  }

  const { cards, progress } = data ?? { cards: [], progress: { done: 0, total: 0 } };

  if (isError || cards.length < 10) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
          <Zap className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Daily Mix</span>
        </div>
        <p className="text-[11px] text-[var(--muted-foreground)]">
          Add at least 10 cards to unlock your daily mix.
        </p>
      </div>
    );
  }

  const { done, total } = progress;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isDone = done >= total;

  const preview = cards.slice(0, 3);
  const remaining = cards.length - 3;

  function handleStart() {
    setCards(cards);
    router.push('/daily/study');
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2.5">
      <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
        <Zap className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Daily Mix</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {preview.map((c) => (
          <span
            key={c.id}
            className="text-[10px] bg-[var(--muted)] text-[var(--text-secondary)] rounded px-1.5 py-0.5"
          >
            {c.word}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-[10px] text-[var(--muted-foreground)]">+{remaining} more</span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-[var(--muted-foreground)]">
          <span>{done}/{total} done</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={isDone}
        className="w-full text-[11px] font-medium rounded-lg px-2 py-1.5 transition-colors
          flex items-center justify-center gap-1
          disabled:opacity-60 disabled:cursor-not-allowed
          bg-[var(--foreground)] text-[var(--background)] hover:opacity-90
          disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
      >
        {isDone ? (
          <><CheckCircle2 className="h-3 w-3" /> Done</>
        ) : done > 0 ? (
          <>Continue →</>
        ) : (
          <><PlayCircle className="h-3 w-3" /> Start</>
        )}
      </button>
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────

export function SidebarWidgets() {
  return (
    <div className="space-y-3 px-3 py-3 border-t border-[var(--border)]">
      <WordOfTheDayWidget />
      <DailyMixWidget />
    </div>
  );
}
