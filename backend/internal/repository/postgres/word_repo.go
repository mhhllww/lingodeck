package postgres

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mhlw/lingodeck/internal/domain"
)

type WordRepo struct {
	db *pgxpool.Pool
}

func NewWordRepo(db *pgxpool.Pool) *WordRepo {
	return &WordRepo{db: db}
}

func (r *WordRepo) Search(ctx context.Context, query string) ([]domain.Word, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, word, transcription, part_of_speech, definitions, examples, synonyms, tags, created_at
		 FROM words WHERE word ILIKE $1 ORDER BY word LIMIT 20`, "%"+query+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var words []domain.Word
	for rows.Next() {
		var w domain.Word
		if err := rows.Scan(&w.ID, &w.Word, &w.Transcription, &w.PartOfSpeech, &w.Definitions, &w.Examples, &w.Synonyms, &w.Tags, &w.CreatedAt); err != nil {
			return nil, err
		}
		words = append(words, w)
	}
	return words, rows.Err()
}

func (r *WordRepo) GetByID(ctx context.Context, id int) (*domain.Word, error) {
	var w domain.Word
	err := r.db.QueryRow(ctx,
		`SELECT id, word, transcription, part_of_speech, definitions, examples, synonyms, tags, created_at
		 FROM words WHERE id = $1`, id).
		Scan(&w.ID, &w.Word, &w.Transcription, &w.PartOfSpeech, &w.Definitions, &w.Examples, &w.Synonyms, &w.Tags, &w.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &w, nil
}

func (r *WordRepo) Create(ctx context.Context, w *domain.Word) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO words (word, transcription, part_of_speech, definitions, examples, synonyms, tags)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
		w.Word, w.Transcription, w.PartOfSpeech, w.Definitions, w.Examples, w.Synonyms, w.Tags).
		Scan(&w.ID, &w.CreatedAt)
}
