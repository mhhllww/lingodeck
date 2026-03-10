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

func (s *dailyService) AddWordOfTheDayToDecks(ctx context.Context, userID uuid.UUID, deckID int) (*domain.Card, error) {
	today := time.Now().UTC().Truncate(24 * time.Hour)

	wod, err := s.repo.GetWordOfTheDay(ctx, today)
	if err != nil {
		return nil, err
	}
	if wod == nil || wod.Word == nil {
		return nil, domain.ErrNotFound
	}

	card := &domain.Card{
		DeckID:        &deckID,
		UserID:        &userID,
		Front:         wod.Word.Word,
		Back:          "",
		Transcription: wod.Word.Transcription,
		PartOfSpeech:  []string{wod.Word.PartOfSpeech},
		Definitions:   wod.Word.Definitions,
		Examples:      wod.Word.Examples,
		Synonyms:      wod.Word.Synonyms,
	}
	if err := s.cards.Create(ctx, card); err != nil {
		return nil, err
	}
	return card, nil
}

func (s *dailyService) GetDailyMix(ctx context.Context, userID uuid.UUID) (*domain.DailyMixResponse, error) {
	today := time.Now().UTC().Truncate(24 * time.Hour)

	// Return saved mix if already generated today
	savedIDs, err := s.repo.GetSavedDailyMix(ctx, userID, today)
	if err != nil {
		return nil, err
	}

	var selected []domain.Card

	if len(savedIDs) > 0 {
		selected, err = s.repo.GetCardsByIDs(ctx, savedIDs)
		if err != nil {
			return nil, err
		}
	} else {
		// Generate fresh mix
		selected, err = s.buildMix(ctx, userID)
		if err != nil {
			return nil, err
		}
		if len(selected) > 0 {
			ids := make([]int, len(selected))
			for i, c := range selected {
				ids[i] = c.ID
			}
			_ = s.repo.SaveDailyMix(ctx, userID, today, ids)
		}
	}

	ids := make([]int, len(selected))
	for i, c := range selected {
		ids[i] = c.ID
	}

	done, err := s.repo.GetDailyProgressCount(ctx, userID, ids)
	if err != nil {
		return nil, err
	}

	return &domain.DailyMixResponse{
		Cards: selected,
		Progress: domain.DailyMixProgress{
			Done:  done,
			Total: len(selected),
		},
	}, nil
}

func (s *dailyService) buildMix(ctx context.Context, userID uuid.UUID) ([]domain.Card, error) {
	candidates, err := s.repo.GetDailyMixCandidates(ctx, userID)
	if err != nil {
		return nil, err
	}

	groups := make(map[int][]domain.Card)
	for _, c := range candidates {
		groups[c.Priority] = append(groups[c.Priority], c.Card)
	}

	targets := []struct{ priority, limit int }{
		{1, 4}, {2, 3}, {3, 2}, {4, 1},
	}

	var selected []domain.Card
	remaining := 10
	for _, t := range targets {
		bucket := groups[t.priority]
		take := t.limit
		if take > len(bucket) {
			take = len(bucket)
		}
		selected = append(selected, bucket[:take]...)
		remaining -= take
	}

	if remaining > 0 {
		usedIDs := make(map[int]bool, len(selected))
		for _, c := range selected {
			usedIDs[c.ID] = true
		}
		for _, c := range candidates {
			if remaining == 0 {
				break
			}
			if !usedIDs[c.Card.ID] {
				selected = append(selected, c.Card)
				usedIDs[c.Card.ID] = true
				remaining--
			}
		}
	}

	return selected, nil
}
