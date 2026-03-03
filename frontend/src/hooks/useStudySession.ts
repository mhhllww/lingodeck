import { useReducer, useCallback } from 'react';
import type { VocabularyCard } from '@/types/card';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

interface StudyState {
  phase: 'idle' | 'studying' | 'results';
  queue: VocabularyCard[];
  gotIt: VocabularyCard[];
  // Cards ever marked "Again" (deduped) — shown in results
  againHistory: VocabularyCard[];
  // Per-card counts for the current session
  againCounts: Record<string, number>;
  totalCards: number;
  startedAt: string;
}

type StudyAction =
  | { type: 'START'; cards: VocabularyCard[] }
  | { type: 'GOT_IT' }
  | { type: 'AGAIN' }
  | { type: 'RESTART_WITH_AGAIN' }
  | { type: 'RESET' };

const IDLE_STATE: StudyState = {
  phase: 'idle',
  queue: [],
  gotIt: [],
  againHistory: [],
  againCounts: {},
  totalCards: 0,
  startedAt: '',
};

function reducer(state: StudyState, action: StudyAction): StudyState {
  switch (action.type) {
    case 'START': {
      const shuffled = shuffle(action.cards);
      return {
        phase: 'studying',
        queue: shuffled,
        gotIt: [],
        againHistory: [],
        againCounts: {},
        totalCards: shuffled.length,
        startedAt: new Date().toISOString(),
      };
    }

    case 'GOT_IT': {
      const [current, ...rest] = state.queue;
      if (!current) return state;
      const newGotIt = [...state.gotIt, current];
      return {
        ...state,
        queue: rest,
        gotIt: newGotIt,
        phase: rest.length === 0 ? 'results' : 'studying',
      };
    }

    case 'AGAIN': {
      const [current, ...rest] = state.queue;
      if (!current) return state;
      const alreadySeen = state.againHistory.some((c) => c.id === current.id);
      const newAgainHistory = alreadySeen
        ? state.againHistory
        : [...state.againHistory, current];
      const newAgainCounts = {
        ...state.againCounts,
        [current.id]: (state.againCounts[current.id] ?? 0) + 1,
      };
      return {
        ...state,
        queue: [...rest, current],
        againHistory: newAgainHistory,
        againCounts: newAgainCounts,
      };
    }

    case 'RESTART_WITH_AGAIN': {
      const shuffled = shuffle(state.againHistory);
      return {
        phase: 'studying',
        queue: shuffled,
        gotIt: [],
        againHistory: [],
        againCounts: {},
        totalCards: shuffled.length,
        startedAt: new Date().toISOString(),
      };
    }

    case 'RESET':
      return IDLE_STATE;
  }
}

export function useStudySession() {
  const [state, dispatch] = useReducer(reducer, IDLE_STATE);

  const start = useCallback((cards: VocabularyCard[]) => {
    dispatch({ type: 'START', cards });
  }, []);

  const markGotIt = useCallback(() => {
    dispatch({ type: 'GOT_IT' });
  }, []);

  const markAgain = useCallback(() => {
    dispatch({ type: 'AGAIN' });
  }, []);

  const restartWithAgain = useCallback(() => {
    dispatch({ type: 'RESTART_WITH_AGAIN' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    phase: state.phase,
    queue: state.queue,
    gotIt: state.gotIt,
    againHistory: state.againHistory,
    againCounts: state.againCounts,
    totalCards: state.totalCards,
    currentCard: state.queue[0] ?? null,
    start,
    markGotIt,
    markAgain,
    restartWithAgain,
    reset,
  };
}
