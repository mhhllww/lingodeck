package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/mhlw/lingodeck/internal/domain"
)

type TranslatorService interface {
	Translate(ctx context.Context, text, sourceLang, targetLang string) (*domain.Translation, error)
	GetHistory(ctx context.Context, limit int) ([]domain.Translation, error)
}

type translatorService struct {
	repo       domain.TranslationRepository
	groqKey    string
	httpClient *http.Client
}

func NewTranslatorService(repo domain.TranslationRepository, groqAPIKey string) TranslatorService {
	return &translatorService{
		repo:    repo,
		groqKey: groqAPIKey,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

var (
	ErrTranslationFailed = errors.New("translation failed")
)

const translatePrompt = `Translate the following text from %s to %s. Return ONLY the translated text, nothing else. No quotes, no explanation, no extra formatting.

Text: %s`

func langName(code string) string {
	switch strings.ToUpper(code) {
	case "EN":
		return "English"
	case "RU":
		return "Russian"
	case "DE":
		return "German"
	case "FR":
		return "French"
	case "ES":
		return "Spanish"
	case "IT":
		return "Italian"
	case "PT":
		return "Portuguese"
	case "JA":
		return "Japanese"
	case "ZH":
		return "Chinese"
	case "KO":
		return "Korean"
	default:
		return code
	}
}

func (s *translatorService) Translate(ctx context.Context, text, sourceLang, targetLang string) (*domain.Translation, error) {
	// Check cache first
	cached, err := s.repo.FindByText(ctx, text, sourceLang, targetLang)
	if err == nil && cached != nil {
		return cached, nil
	}
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		slog.Warn("cache lookup failed", "error", err)
	}

	translatedText, err := s.callGroq(ctx, text, sourceLang, targetLang)
	if err != nil {
		return nil, err
	}

	t := &domain.Translation{
		SourceText: text,
		TargetText: translatedText,
		SourceLang: sourceLang,
		TargetLang: targetLang,
	}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, fmt.Errorf("saving translation: %w", err)
	}
	return t, nil
}

func (s *translatorService) callGroq(ctx context.Context, text, sourceLang, targetLang string) (string, error) {
	prompt := fmt.Sprintf(translatePrompt, langName(sourceLang), langName(targetLang), text)

	reqBody := groqRequest{
		Model: groqModel,
		Messages: []groqMessage{
			{Role: "user", Content: prompt},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshaling request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, groqAPIURL, bytes.NewReader(jsonBody))
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.groqKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("calling Groq API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading Groq response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Groq API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var groqResp groqResponse
	if err := json.Unmarshal(respBody, &groqResp); err != nil {
		return "", fmt.Errorf("decoding Groq response: %w", err)
	}

	if len(groqResp.Choices) == 0 {
		return "", fmt.Errorf("Groq returned no choices")
	}

	return strings.TrimSpace(groqResp.Choices[0].Message.Content), nil
}

func (s *translatorService) GetHistory(ctx context.Context, limit int) ([]domain.Translation, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.repo.GetHistory(ctx, limit)
}
