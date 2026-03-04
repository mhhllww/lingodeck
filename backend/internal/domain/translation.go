package domain

import (
	"context"
	"time"
)

type Translation struct {
	ID         int       `json:"id"`
	SourceText string    `json:"source_text"`
	TargetText string    `json:"target_text"`
	SourceLang string    `json:"source_lang"`
	TargetLang string    `json:"target_lang"`
	CreatedAt  time.Time `json:"created_at"`
}

type TranslationRepository interface {
	Create(ctx context.Context, t *Translation) error
	FindByText(ctx context.Context, sourceText, sourceLang, targetLang string) (*Translation, error)
	GetHistory(ctx context.Context, limit int) ([]Translation, error)
}
