package service

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/mhlw/lingodeck/internal/domain"
)

type dailyService struct {
	repo domain.DailyRepository
	decks domain.DeckRepository
	cards domain.CardRepository
	dict DictionaryService
	groq *GroqService
}

func NewDailyService(
	repo domain.DailyRepository,
	decks domain.DeckRepository,
	cards domain.CardRepository,
	dict DictionaryService,
	groq *GroqService,
) domain.DailyService {
	svc := &dailyService{repo: repo, decks: decks, cards: cards, dict: dict, groq: groq}
	go svc.runCron()
	return svc
}

// runCron picks a word of the day at startup and then every midnight UTC.
func (s *dailyService) runCron() {
	s.pickWordOfTheDay()

	for {
		now := time.Now().UTC()
		nextMidnight := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, time.UTC)
		timer := time.NewTimer(time.Until(nextMidnight))
		<-timer.C
		s.pickWordOfTheDay()
	}
}

func (s *dailyService) pickWordOfTheDay() {
	ctx := context.Background()
	today := time.Now().UTC().Truncate(24 * time.Hour)

	existing, err := s.repo.GetWordOfTheDay(ctx, today)
	if err != nil {
		slog.Error("daily cron: failed to check existing word", "error", err)
		return
	}
	if existing != nil {
		return
	}

	recentWords, err := s.repo.GetRecentWords(ctx, 30)
	if err != nil {
		slog.Error("daily cron: failed to get recent words", "error", err)
		recentWords = []string{}
	}

	const maxAttempts = 3
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		wordStr, err := s.groq.GenerateWordOfTheDay(ctx, recentWords)
		if err != nil {
			slog.Error("daily cron: Groq failed", "attempt", attempt, "error", err)
			continue
		}

		// Check if already used in last 30 days
		alreadyUsed := false
		for _, w := range recentWords {
			if w == wordStr {
				alreadyUsed = true
				break
			}
		}
		if alreadyUsed {
			slog.Warn("daily cron: Groq returned already-used word, retrying", "word", wordStr, "attempt", attempt)
			continue
		}

		// Enrich via DictionaryService (saves to words if not exists)
		words, err := s.dict.Search(ctx, wordStr)
		if err != nil || len(words) == 0 {
			slog.Error("daily cron: failed to enrich word", "word", wordStr, "attempt", attempt, "error", err)
			continue
		}

		if err := s.repo.SetWordOfTheDay(ctx, words[0].ID, today); err != nil {
			slog.Error("daily cron: failed to set word of the day", "error", err)
			return
		}
		slog.Info("daily cron: word of the day set", "word", wordStr)
		return
	}

	slog.Error("daily cron: all attempts failed, no word of the day today")
}

func (s *dailyService) GetWordOfTheDay(ctx context.Context, userID uuid.UUID) (*domain.WordOfTheDayResponse, error) {
	today := time.Now().UTC().Truncate(24 * time.Hour)

	wod, err := s.repo.GetWordOfTheDay(ctx, today)
	if err != nil {
		return nil, err
	}
	if wod == nil || wod.Word == nil {
		return nil, nil
	}

	definition := ""
	if len(wod.Word.Definitions) > 0 {
		definition = wod.Word.Definitions[0]
	}

	resp := &domain.WordOfTheDayResponse{
		Word:          wod.Word.Word,
		Transcription: wod.Word.Transcription,
		PartOfSpeech:  wod.Word.PartOfSpeech,
		Definition:    definition,
	}

	// Check if word already in user's cards
	already, err := s.repo.WordExistsInUserCards(ctx, userID, wod.Word.Word)
	if err == nil {
		resp.AlreadyAdded = already
	}

	// Find suggested deck for user
	decks, err := s.decks.List(ctx, userID)
	if err == nil && len(decks) > 0 {
		resp.SuggestedDeck = &domain.SuggestedDeck{
			ID:   decks[0].ID,
			Name: decks[0].Name,
		}
	}

	return resp, nil
}

func (s *dailyService) AddWordOfTheDayToDecks(ctx context.Context, userID uuid.UUID, deckID int) error {
	today := time.Now().UTC().Truncate(24 * time.Hour)

	wod, err := s.repo.GetWordOfTheDay(ctx, today)
	if err != nil {
		return err
	}
	if wod == nil || wod.Word == nil {
		return domain.ErrNotFound
	}

	card := &domain.Card{
		DeckID:        deckID,
		UserID:        &userID,
		Front:         wod.Word.Word,
		Back:          "",
		Transcription: wod.Word.Transcription,
		PartOfSpeech:  []string{wod.Word.PartOfSpeech},
		Definitions:   wod.Word.Definitions,
		Examples:      wod.Word.Examples,
		Synonyms:      wod.Word.Synonyms,
	}
	return s.cards.Create(ctx, card)
}

func (s *dailyService) GetDailyMix(ctx context.Context, userID uuid.UUID) (*domain.DailyMixResponse, error) {
	cards, err := s.repo.GetDailyMixCards(ctx, userID)
	if err != nil {
		return nil, err
	}

	ids := make([]int, len(cards))
	for i, c := range cards {
		ids[i] = c.ID
	}

	done, err := s.repo.GetDailyProgressCount(ctx, userID, ids)
	if err != nil {
		return nil, err
	}

	return &domain.DailyMixResponse{
		Cards: cards,
		Progress: domain.DailyMixProgress{
			Done:  done,
			Total: len(cards),
		},
	}, nil
}
