package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mhlw/lingodeck/internal/domain"
)

type DailyRepo struct {
	db *pgxpool.Pool
}

func NewDailyRepo(db *pgxpool.Pool) *DailyRepo {
	return &DailyRepo{db: db}
}

func (r *DailyRepo) GetWordOfTheDay(ctx context.Context, date time.Time) (*domain.WordOfTheDay, error) {
	row := r.db.QueryRow(ctx, `
		SELECT w.id, w.word, w.transcription, w.part_of_speech, w.definitions, w.examples, w.synonyms, w.created_at,
		       wod.id, wod.date, wod.created_at
		FROM word_of_the_day wod
		JOIN words w ON w.id = wod.word_id
		WHERE wod.date = $1
	`, date.UTC().Truncate(24*time.Hour))

	var word domain.Word
	var wod domain.WordOfTheDay
	err := row.Scan(
		&word.ID, &word.Word, &word.Transcription, &word.PartOfSpeech,
		&word.Definitions, &word.Examples, &word.Synonyms, &word.CreatedAt,
		&wod.ID, &wod.Date, &wod.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	wod.WordID = word.ID
	wod.Word = &word
	return &wod, nil
}

func (r *DailyRepo) SetWordOfTheDay(ctx context.Context, wordID int, date time.Time) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO word_of_the_day (word_id, date) VALUES ($1, $2) ON CONFLICT (date) DO NOTHING`,
		wordID, date.UTC().Truncate(24*time.Hour),
	)
	return err
}

func (r *DailyRepo) GetRecentWords(ctx context.Context, limit int) ([]string, error) {
	rows, err := r.db.Query(ctx, `
		SELECT w.word FROM word_of_the_day wod
		JOIN words w ON w.id = wod.word_id
		ORDER BY wod.date DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var words []string
	for rows.Next() {
		var word string
		if err := rows.Scan(&word); err != nil {
			return nil, err
		}
		words = append(words, word)
	}
	return words, rows.Err()
}

func (r *DailyRepo) GetWordByWord(ctx context.Context, word string) (*domain.Word, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, word, transcription, part_of_speech, definitions, examples, synonyms, created_at
		FROM words WHERE word = $1
	`, word)
	return scanWord(row)
}

func scanWord(row pgx.Row) (*domain.Word, error) {
	var w domain.Word
	err := row.Scan(&w.ID, &w.Word, &w.Transcription, &w.PartOfSpeech,
		&w.Definitions, &w.Examples, &w.Synonyms, &w.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &w, nil
}

func (r *DailyRepo) WordExistsInUserCards(ctx context.Context, userID uuid.UUID, word string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM cards WHERE user_id = $1 AND front = $2)`,
		userID, word,
	).Scan(&exists)
	return exists, err
}

// GetDailyMixCandidates returns all candidate cards with priority (no per-group limit).
// Fill-up logic is applied in the service layer.
func (r *DailyRepo) GetDailyMixCandidates(ctx context.Context, userID uuid.UUID) ([]domain.DailyMixCandidate, error) {
	rows, err := r.db.Query(ctx, `
		WITH hard AS (
			SELECT `+cardColumns+`, 1 AS priority
			FROM cards
			WHERE user_id = $1 AND times_incorrect > 0
			ORDER BY times_incorrect DESC
		),
		stale AS (
			SELECT `+cardColumns+`, 2 AS priority
			FROM cards
			WHERE user_id = $1
			  AND (times_correct > 0 OR times_incorrect > 0)
			  AND id NOT IN (SELECT id FROM hard)
			ORDER BY updated_at ASC
		),
		fresh AS (
			SELECT `+cardColumns+`, 3 AS priority
			FROM cards
			WHERE user_id = $1
			  AND times_correct = 0 AND times_incorrect = 0
			  AND id NOT IN (SELECT id FROM hard)
			  AND id NOT IN (SELECT id FROM stale)
		),
		wod_card AS (
			SELECT `+cardColumns+`, 4 AS priority
			FROM cards
			WHERE user_id = $1
			  AND front = (
			    SELECT w.word FROM word_of_the_day wod
			    JOIN words w ON w.id = wod.word_id
			    WHERE wod.date = CURRENT_DATE
			    LIMIT 1
			  )
			  AND id NOT IN (SELECT id FROM hard)
			  AND id NOT IN (SELECT id FROM stale)
			  AND id NOT IN (SELECT id FROM fresh)
			LIMIT 1
		)
		SELECT `+cardColumns+`, priority FROM (
			SELECT * FROM hard
			UNION ALL SELECT * FROM stale
			UNION ALL SELECT * FROM fresh
			UNION ALL SELECT * FROM wod_card
		) combined
		ORDER BY priority, id
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var candidates []domain.DailyMixCandidate
	for rows.Next() {
		var c domain.Card
		var priority int
		if err := rows.Scan(
			&c.ID, &c.DeckID, &c.Front, &c.Back, &c.Transcription,
			&c.PartOfSpeech, &c.Definitions, &c.Examples,
			&c.Synonyms, &c.Antonyms, &c.Tags,
			&c.TimesCorrect, &c.TimesIncorrect, &c.LastStudiedAt,
			&c.CreatedAt, &c.UpdatedAt,
			&priority,
		); err != nil {
			return nil, err
		}
		candidates = append(candidates, domain.DailyMixCandidate{Card: c, Priority: priority})
	}
	return candidates, rows.Err()
}

func (r *DailyRepo) GetDailyProgressCount(ctx context.Context, userID uuid.UUID, cardIDs []int) (int, error) {
	if len(cardIDs) == 0 {
		return 0, nil
	}
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM cards
		WHERE user_id = $1
		  AND id = ANY($2)
		  AND last_studied_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
	`, userID, cardIDs).Scan(&count)
	return count, err
}
