export interface VocabularyCard {
  id: string;
  word: string;
  translation: string;
  transcription?: string;
  partOfSpeech?: string[];
  definitions?: string[];
  examples?: string[];
  synonyms?: string[];
  createdAt: string;
  tags?: string[];
  deckId?: string;
  // Study stats
  lastStudiedAt?: string;
  timesCorrect?: number;
  timesIncorrect?: number;
}

export interface StudySession {
  deckId: string;
  startedAt: string;
  cards: SessionCard[];
}

export interface SessionCard {
  cardId: string;
  status: 'pending' | 'got_it' | 'again';
}

export interface Deck {
  id: string;
  name: string;
  tags: string[];
  color: string;
  createdAt: string;
}

export type CardSortField = 'createdAt' | 'word';
export type CardSortOrder = 'asc' | 'desc';

export interface CardFilters {
  query: string;
  tags: string[];
  sortField: CardSortField;
  sortOrder: CardSortOrder;
}
