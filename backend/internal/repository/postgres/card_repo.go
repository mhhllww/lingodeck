package postgres

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mhlw/lingodeck/internal/domain"
)

type CardRepo struct {
	db *pgxpool.Pool
}

func NewCardRepo(db *pgxpool.Pool) *CardRepo {
	return &CardRepo{db: db}
}

const cardColumns = `id, deck_id, front, back, transcription, part_of_speech, definitions,
	examples, synonyms, antonyms, tags, times_correct, times_incorrect, last_studied_at,
	created_at, updated_at`

func scanCard(row pgx.Row) (*domain.Card, error) {
	var c domain.Card
	err := row.Scan(
		&c.ID, &c.DeckID, &c.Front, &c.Back, &c.Transcription,
		&c.PartOfSpeech, &c.Definitions, &c.Examples,
		&c.Synonyms, &c.Antonyms, &c.Tags,
		&c.TimesCorrect, &c.TimesIncorrect, &c.LastStudiedAt,
		&c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func scanCards(rows pgx.Rows) ([]domain.Card, error) {
	var cards []domain.Card
	for rows.Next() {
		var c domain.Card
		if err := rows.Scan(
			&c.ID, &c.DeckID, &c.Front, &c.Back, &c.Transcription,
			&c.PartOfSpeech, &c.Definitions, &c.Examples,
			&c.Synonyms, &c.Antonyms, &c.Tags,
			&c.TimesCorrect, &c.TimesIncorrect, &c.LastStudiedAt,
			&c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		cards = append(cards, c)
	}
	return cards, rows.Err()
}

func (r *CardRepo) ListByDeck(ctx context.Context, deckID int) ([]domain.Card, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+cardColumns+` FROM cards WHERE deck_id = $1 ORDER BY created_at`, deckID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanCards(rows)
}

func (r *CardRepo) List(ctx context.Context, userID uuid.UUID, deckID *int, query string) ([]domain.Card, error) {
	conditions := []string{"user_id = $1"}
	args := []any{userID}
	argIdx := 2

	if deckID != nil {
		conditions = append(conditions, fmt.Sprintf("deck_id = $%d", argIdx))
		args = append(args, *deckID)
		argIdx++
	}
	if query != "" {
		conditions = append(conditions, fmt.Sprintf("(front ILIKE $%d OR back ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+query+"%")
	}

	sql := `SELECT ` + cardColumns + ` FROM cards WHERE ` + strings.Join(conditions, " AND ") + ` ORDER BY created_at`

	rows, err := r.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanCards(rows)
}

func (r *CardRepo) GetByID(ctx context.Context, id int) (*domain.Card, error) {
	row := r.db.QueryRow(ctx,
		`SELECT `+cardColumns+` FROM cards WHERE id = $1`, id)
	c, err := scanCard(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return c, nil
}

func (r *CardRepo) Create(ctx context.Context, c *domain.Card) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO cards (deck_id, front, back, transcription, part_of_speech, definitions,
		 examples, synonyms, antonyms, tags, user_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING id, times_correct, times_incorrect, last_studied_at, created_at, updated_at`,
		c.DeckID, c.Front, c.Back, c.Transcription,
		emptyIfNil(c.PartOfSpeech), emptyIfNil(c.Definitions), emptyIfNil(c.Examples),
		emptyIfNil(c.Synonyms), emptyIfNil(c.Antonyms), emptyIfNil(c.Tags), c.UserID).
		Scan(&c.ID, &c.TimesCorrect, &c.TimesIncorrect, &c.LastStudiedAt, &c.CreatedAt, &c.UpdatedAt)
}

func (r *CardRepo) Update(ctx context.Context, c *domain.Card) error {
	return r.db.QueryRow(ctx,
		`UPDATE cards SET front = $1, back = $2, transcription = $3, part_of_speech = $4,
		 definitions = $5, examples = $6, synonyms = $7, antonyms = $8, tags = $9,
		 deck_id = $10, updated_at = NOW()
		 WHERE id = $11 RETURNING updated_at`,
		c.Front, c.Back, c.Transcription,
		emptyIfNil(c.PartOfSpeech), emptyIfNil(c.Definitions), emptyIfNil(c.Examples),
		emptyIfNil(c.Synonyms), emptyIfNil(c.Antonyms), emptyIfNil(c.Tags), c.DeckID, c.ID).
		Scan(&c.UpdatedAt)
}

func (r *CardRepo) Delete(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM cards WHERE id = $1`, id)
	return err
}

func (r *CardRepo) BulkUpdateStudyStats(ctx context.Context, results []domain.StudyCardResult) error {
	now := time.Now()
	batch := &pgx.Batch{}
	for _, res := range results {
		if res.Correct {
			batch.Queue(
				`UPDATE cards SET times_correct = times_correct + 1, last_studied_at = $1, updated_at = NOW() WHERE id = $2`,
				now, res.CardID)
		} else {
			batch.Queue(
				`UPDATE cards SET times_incorrect = times_incorrect + 1, last_studied_at = $1, updated_at = NOW() WHERE id = $2`,
				now, res.CardID)
		}
	}
	br := r.db.SendBatch(ctx, batch)
	defer br.Close()
	for range results {
		if _, err := br.Exec(); err != nil {
			return err
		}
	}
	return nil
}

func (r *CardRepo) DetachFromDeck(ctx context.Context, deckID int) error {
	_, err := r.db.Exec(ctx, `UPDATE cards SET deck_id = NULL WHERE deck_id = $1`, deckID)
	return err
}

func (r *CardRepo) DeleteByDeck(ctx context.Context, deckID int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM cards WHERE deck_id = $1`, deckID)
	return err
}

func emptyIfNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}
