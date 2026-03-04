package service

import (
	"context"
	"log/slog"

	"github.com/mhlw/lingodeck/internal/domain"
)

type DictionaryService interface {
	Search(ctx context.Context, query string) ([]domain.Word, error)
	GetByID(ctx context.Context, id int) (*domain.Word, error)
}

type dictionaryService struct {
	repo domain.WordRepository
	groq *GroqService
}

func NewDictionaryService(repo domain.WordRepository, groq *GroqService) DictionaryService {
	return &dictionaryService{repo: repo, groq: groq}
}

func (s *dictionaryService) Search(ctx context.Context, query string) ([]domain.Word, error) {
	words, err := s.repo.Search(ctx, query)
	if err != nil {
		return nil, err
	}
	if len(words) > 0 {
		return words, nil
	}

	slog.Info("word not found in DB, calling Groq", "query", query)
	word, err := s.groq.EnrichWord(ctx, query)
	if err != nil {
		slog.Error("groq enrichment failed", "error", err)
		return nil, err
	}

	if err := s.repo.Create(ctx, word); err != nil {
		slog.Error("failed to save enriched word", "error", err)
		return nil, err
	}

	return []domain.Word{*word}, nil
}

func (s *dictionaryService) GetByID(ctx context.Context, id int) (*domain.Word, error) {
	return s.repo.GetByID(ctx, id)
}
