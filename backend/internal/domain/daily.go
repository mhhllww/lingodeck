package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type WordOfTheDay struct {
	ID        uuid.UUID
	WordID    int
	Date      time.Time
	CreatedAt time.Time
	Word      *Word
}

type DailyRepository interface {
	// Word of the day
	GetWordOfTheDay(ctx context.Context, date time.Time) (*WordOfTheDay, error)
	SetWordOfTheDay(ctx context.Context, wordID int, date time.Time) error
	GetRecentWords(ctx context.Context, limit int) ([]string, error)
	GetWordByWord(ctx context.Context, word string) (*Word, error)
	WordExistsInUserCards(ctx context.Context, userID uuid.UUID, word string) (bool, error)

	// Daily mix
	GetDailyMixCards(ctx context.Context, userID uuid.UUID) ([]Card, error)
	GetDailyProgressCount(ctx context.Context, userID uuid.UUID, cardIDs []int) (int, error)
}

type DailyService interface {
	GetWordOfTheDay(ctx context.Context, userID uuid.UUID) (*WordOfTheDayResponse, error)
	AddWordOfTheDayToDecks(ctx context.Context, userID uuid.UUID, deckID int) error
	GetDailyMix(ctx context.Context, userID uuid.UUID) (*DailyMixResponse, error)
}

type SuggestedDeck struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type WordOfTheDayResponse struct {
	Word          string         `json:"word"`
	Transcription string         `json:"transcription"`
	PartOfSpeech  string         `json:"part_of_speech"`
	Definition    string         `json:"definition"`
	SuggestedDeck *SuggestedDeck `json:"suggested_deck"`
	AlreadyAdded  bool           `json:"already_added"`
}

type DailyMixProgress struct {
	Done  int `json:"done"`
	Total int `json:"total"`
}

type DailyMixResponse struct {
	Cards    []Card           `json:"cards"`
	Progress DailyMixProgress `json:"progress"`
}
