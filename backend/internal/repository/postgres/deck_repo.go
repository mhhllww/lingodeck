package postgres

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mhlw/lingodeck/internal/domain"
)

type DeckRepo struct {
	db *pgxpool.Pool
}

func NewDeckRepo(db *pgxpool.Pool) *DeckRepo {
	return &DeckRepo{db: db}
}

func (r *DeckRepo) List(ctx context.Context) ([]domain.Deck, error) {
	rows, err := r.db.Query(ctx,
		`SELECT d.id, d.name, d.description, d.color, d.tags,
		 COUNT(c.id) AS card_count, d.created_at, d.updated_at
		 FROM decks d LEFT JOIN cards c ON c.deck_id = d.id
		 GROUP BY d.id ORDER BY d.created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var decks []domain.Deck
	for rows.Next() {
		var d domain.Deck
		if err := rows.Scan(&d.ID, &d.Name, &d.Description, &d.Color, &d.Tags,
			&d.CardCount, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		decks = append(decks, d)
	}
	return decks, rows.Err()
}

func (r *DeckRepo) GetByID(ctx context.Context, id int) (*domain.Deck, error) {
	var d domain.Deck
	err := r.db.QueryRow(ctx,
		`SELECT d.id, d.name, d.description, d.color, d.tags,
		 COUNT(c.id) AS card_count, d.created_at, d.updated_at
		 FROM decks d LEFT JOIN cards c ON c.deck_id = d.id
		 WHERE d.id = $1 GROUP BY d.id`, id).
		Scan(&d.ID, &d.Name, &d.Description, &d.Color, &d.Tags,
			&d.CardCount, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &d, nil
}

func (r *DeckRepo) Create(ctx context.Context, d *domain.Deck) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO decks (name, description, color, tags)
		 VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`,
		d.Name, d.Description, d.Color, emptyIfNil(d.Tags)).
		Scan(&d.ID, &d.CreatedAt, &d.UpdatedAt)
}

func (r *DeckRepo) Update(ctx context.Context, d *domain.Deck) error {
	return r.db.QueryRow(ctx,
		`UPDATE decks SET name = $1, description = $2, color = $3, tags = $4, updated_at = NOW()
		 WHERE id = $5 RETURNING updated_at`,
		d.Name, d.Description, d.Color, emptyIfNil(d.Tags), d.ID).
		Scan(&d.UpdatedAt)
}

func (r *DeckRepo) Delete(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM decks WHERE id = $1`, id)
	return err
}
