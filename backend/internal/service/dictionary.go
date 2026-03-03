package service

import (
	"context"

	"github.com/mhlw/lingodeck/internal/domain"
)

type DictionaryService interface {
	Search(ctx context.Context, query string) ([]domain.Word, error)
	GetByID(ctx context.Context, id int) (*domain.Word, error)
}

type dictionaryService struct {
	repo domain.WordRepository
}

func NewDictionaryService(repo domain.WordRepository) DictionaryService {
	return &dictionaryService{repo: repo}
}

func (s *dictionaryService) Search(ctx context.Context, query string) ([]domain.Word, error) {
	return s.repo.Search(ctx, query)
}

func (s *dictionaryService) GetByID(ctx context.Context, id int) (*domain.Word, error) {
	return s.repo.GetByID(ctx, id)
}
