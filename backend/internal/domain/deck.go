package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Deck struct {
	ID          int        `json:"id"`
	UserID      *uuid.UUID `json:"user_id,omitempty"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Color       string    `json:"color"`
	Tags        []string  `json:"tags"`
	CardCount   int       `json:"card_count"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type DeckRepository interface {
	List(ctx context.Context, userID uuid.UUID) ([]Deck, error)
	GetByID(ctx context.Context, id int) (*Deck, error)
	Create(ctx context.Context, d *Deck) error
	Update(ctx context.Context, d *Deck) error
	Delete(ctx context.Context, id int) error
}
