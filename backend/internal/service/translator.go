package service

import (
	"context"
	"fmt"

	"github.com/mhlw/lingodeck/internal/domain"
)

type TranslatorService interface {
	Translate(ctx context.Context, text, sourceLang, targetLang string) (*domain.Translation, error)
	GetHistory(ctx context.Context, limit int) ([]domain.Translation, error)
}

type translatorService struct {
	repo domain.TranslationRepository
}

func NewTranslatorService(repo domain.TranslationRepository) TranslatorService {
	return &translatorService{repo: repo}
}

// Translate is a stub — stores the translation request with a placeholder target text.
// Replace this with an external API call (e.g. Google Translate) later.
func (s *translatorService) Translate(ctx context.Context, text, sourceLang, targetLang string) (*domain.Translation, error) {
	t := &domain.Translation{
		SourceText: text,
		TargetText: fmt.Sprintf("[stub: %s -> %s] %s", sourceLang, targetLang, text),
		SourceLang: sourceLang,
		TargetLang: targetLang,
	}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *translatorService) GetHistory(ctx context.Context, limit int) ([]domain.Translation, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.repo.GetHistory(ctx, limit)
}
