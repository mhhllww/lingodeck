package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mhlw/lingodeck/internal/domain"
)

type TranslationRepo struct {
	db *pgxpool.Pool
}

func NewTranslationRepo(db *pgxpool.Pool) *TranslationRepo {
	return &TranslationRepo{db: db}
}

func (r *TranslationRepo) Create(ctx context.Context, t *domain.Translation) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO translations (source_text, target_text, source_lang, target_lang)
		 VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
		t.SourceText, t.TargetText, t.SourceLang, t.TargetLang).
		Scan(&t.ID, &t.CreatedAt)
}

func (r *TranslationRepo) GetHistory(ctx context.Context, limit int) ([]domain.Translation, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, source_text, target_text, source_lang, target_lang, created_at
		 FROM translations ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var translations []domain.Translation
	for rows.Next() {
		var t domain.Translation
		if err := rows.Scan(&t.ID, &t.SourceText, &t.TargetText, &t.SourceLang, &t.TargetLang, &t.CreatedAt); err != nil {
			return nil, err
		}
		translations = append(translations, t)
	}
	return translations, rows.Err()
}
