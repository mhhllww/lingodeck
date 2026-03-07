package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Card struct {
	ID             int        `json:"id"`
	DeckID         int        `json:"deck_id"`
	UserID         *uuid.UUID `json:"user_id,omitempty"`
	Front          string     `json:"front"`
	Back           string     `json:"back"`
	Transcription  string     `json:"transcription"`
	PartOfSpeech   []string   `json:"part_of_speech"`
	Definitions    []string   `json:"definitions"`
	Examples       []string   `json:"examples"`
	Synonyms       []string   `json:"synonyms"`
	Antonyms       []string   `json:"antonyms"`
	Tags           []string   `json:"tags"`
	TimesCorrect   int        `json:"times_correct"`
	TimesIncorrect int        `json:"times_incorrect"`
	LastStudiedAt  *time.Time `json:"last_studied_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type StudyCardResult struct {
	CardID  int  `json:"card_id"`
	Correct bool `json:"correct"`
}

type CardRepository interface {
	ListByDeck(ctx context.Context, deckID int) ([]Card, error)
	List(ctx context.Context, userID uuid.UUID, deckID *int, query string) ([]Card, error)
	GetByID(ctx context.Context, id int) (*Card, error)
	Create(ctx context.Context, c *Card) error
	Update(ctx context.Context, c *Card) error
	Delete(ctx context.Context, id int) error
	BulkUpdateStudyStats(ctx context.Context, results []StudyCardResult) error
}
