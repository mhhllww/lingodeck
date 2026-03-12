package domain

import (
	"context"
	"time"
)

type Word struct {
	ID            int       `json:"id"`
	Word          string    `json:"word"`
	Transcription string    `json:"transcription"`
	PartOfSpeech  string    `json:"part_of_speech"`
	Definitions   []string  `json:"definitions"`
	Examples      []string  `json:"examples"`
	Synonyms      []string  `json:"synonyms"`
	Tags          []string  `json:"tags"`
	CreatedAt     time.Time `json:"created_at"`
}

type WordRepository interface {
	Search(ctx context.Context, query string) ([]Word, error)
	GetByID(ctx context.Context, id int) (*Word, error)
	Create(ctx context.Context, w *Word) error
}
