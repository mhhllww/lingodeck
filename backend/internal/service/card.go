package service

import (
	"context"

	"github.com/mhlw/lingodeck/internal/domain"
)

type CardService interface {
	ListByDeck(ctx context.Context, deckID int) ([]domain.Card, error)
	ListCards(ctx context.Context, deckID *int, query string) ([]domain.Card, error)
	GetCard(ctx context.Context, id int) (*domain.Card, error)
	CreateCard(ctx context.Context, c *domain.Card) error
	UpdateCard(ctx context.Context, c *domain.Card) error
	DeleteCard(ctx context.Context, id int) error
	SaveStudyResults(ctx context.Context, results []domain.StudyCardResult) error

	ListDecks(ctx context.Context) ([]domain.Deck, error)
	GetDeck(ctx context.Context, id int) (*domain.Deck, error)
	CreateDeck(ctx context.Context, d *domain.Deck) error
	UpdateDeck(ctx context.Context, d *domain.Deck) error
	DeleteDeck(ctx context.Context, id int) error
}

type cardService struct {
	cards domain.CardRepository
	decks domain.DeckRepository
}

func NewCardService(cards domain.CardRepository, decks domain.DeckRepository) CardService {
	return &cardService{cards: cards, decks: decks}
}

func (s *cardService) ListByDeck(ctx context.Context, deckID int) ([]domain.Card, error) {
	return s.cards.ListByDeck(ctx, deckID)
}

func (s *cardService) ListCards(ctx context.Context, deckID *int, query string) ([]domain.Card, error) {
	return s.cards.List(ctx, deckID, query)
}

func (s *cardService) GetCard(ctx context.Context, id int) (*domain.Card, error) {
	return s.cards.GetByID(ctx, id)
}

func (s *cardService) CreateCard(ctx context.Context, c *domain.Card) error {
	return s.cards.Create(ctx, c)
}

func (s *cardService) UpdateCard(ctx context.Context, c *domain.Card) error {
	return s.cards.Update(ctx, c)
}

func (s *cardService) DeleteCard(ctx context.Context, id int) error {
	return s.cards.Delete(ctx, id)
}

func (s *cardService) SaveStudyResults(ctx context.Context, results []domain.StudyCardResult) error {
	return s.cards.BulkUpdateStudyStats(ctx, results)
}

func (s *cardService) ListDecks(ctx context.Context) ([]domain.Deck, error) {
	return s.decks.List(ctx)
}

func (s *cardService) GetDeck(ctx context.Context, id int) (*domain.Deck, error) {
	return s.decks.GetByID(ctx, id)
}

func (s *cardService) CreateDeck(ctx context.Context, d *domain.Deck) error {
	return s.decks.Create(ctx, d)
}

func (s *cardService) UpdateDeck(ctx context.Context, d *domain.Deck) error {
	return s.decks.Update(ctx, d)
}

func (s *cardService) DeleteDeck(ctx context.Context, id int) error {
	return s.decks.Delete(ctx, id)
}
