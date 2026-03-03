package handler

import (
	"strconv"

	"github.com/mhlw/lingodeck/internal/domain"
)

type CardResponse struct {
	ID             string   `json:"id"`
	DeckID         string   `json:"deck_id"`
	Front          string   `json:"front"`
	Back           string   `json:"back"`
	Transcription  string   `json:"transcription"`
	PartOfSpeech   []string `json:"part_of_speech"`
	Definitions    []string `json:"definitions"`
	Examples       []string `json:"examples"`
	Synonyms       []string `json:"synonyms"`
	Antonyms       []string `json:"antonyms"`
	Tags           []string `json:"tags"`
	TimesCorrect   int      `json:"times_correct"`
	TimesIncorrect int      `json:"times_incorrect"`
	LastStudiedAt  *string  `json:"last_studied_at"`
	CreatedAt      string   `json:"created_at"`
	UpdatedAt      string   `json:"updated_at"`
}

type DeckResponse struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Color       string   `json:"color"`
	Tags        []string `json:"tags"`
	CardCount   int      `json:"card_count"`
	CreatedAt   string   `json:"created_at"`
	UpdatedAt   string   `json:"updated_at"`
}

func emptyIfNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}

func toCardResponse(c domain.Card) CardResponse {
	var lastStudied *string
	if c.LastStudiedAt != nil {
		s := c.LastStudiedAt.Format("2006-01-02T15:04:05Z")
		lastStudied = &s
	}
	return CardResponse{
		ID:             strconv.Itoa(c.ID),
		DeckID:         strconv.Itoa(c.DeckID),
		Front:          c.Front,
		Back:           c.Back,
		Transcription:  c.Transcription,
		PartOfSpeech:   emptyIfNil(c.PartOfSpeech),
		Definitions:    emptyIfNil(c.Definitions),
		Examples:       emptyIfNil(c.Examples),
		Synonyms:       emptyIfNil(c.Synonyms),
		Antonyms:       emptyIfNil(c.Antonyms),
		Tags:           emptyIfNil(c.Tags),
		TimesCorrect:   c.TimesCorrect,
		TimesIncorrect: c.TimesIncorrect,
		LastStudiedAt:  lastStudied,
		CreatedAt:      c.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:      c.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func toCardResponses(cards []domain.Card) []CardResponse {
	out := make([]CardResponse, len(cards))
	for i, c := range cards {
		out[i] = toCardResponse(c)
	}
	return out
}

func toDeckResponse(d domain.Deck) DeckResponse {
	return DeckResponse{
		ID:          strconv.Itoa(d.ID),
		Name:        d.Name,
		Description: d.Description,
		Color:       d.Color,
		Tags:        emptyIfNil(d.Tags),
		CardCount:   d.CardCount,
		CreatedAt:   d.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   d.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func toDeckResponses(decks []domain.Deck) []DeckResponse {
	out := make([]DeckResponse, len(decks))
	for i, d := range decks {
		out[i] = toDeckResponse(d)
	}
	return out
}
