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
	apiKey     string
	httpClient *http.Client
}

func NewTranslatorService(repo domain.TranslationRepository, deeplAPIKey string) TranslatorService {
	return &translatorService{
		repo:   repo,
		apiKey: deeplAPIKey,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

var (
	ErrDeepLUnauthorized = errors.New("invalid DeepL API key")
	ErrDeepLRateLimit    = errors.New("DeepL API rate limit exceeded, try again later")
	ErrDeepLQuotaExceeded = errors.New("DeepL API translation quota exceeded")
	ErrDeepLUnavailable  = errors.New("DeepL API is temporarily unavailable")
)

type deeplRequest struct {
	Text       []string `json:"text"`
	TargetLang string   `json:"target_lang"`
	SourceLang string   `json:"source_lang,omitempty"`
}

type deeplResponse struct {
	Translations []struct {
		Text string `json:"text"`
	} `json:"translations"`
	Message string `json:"message"`
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

	// Call DeepL API
	translatedText, err := s.callDeepL(ctx, text, sourceLang, targetLang)
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

func (s *translatorService) callDeepL(ctx context.Context, text, sourceLang, targetLang string) (string, error) {
	body := deeplRequest{
		Text:       []string{text},
		TargetLang: strings.ToUpper(targetLang),
	}
	if sourceLang != "" {
		body.SourceLang = strings.ToUpper(sourceLang)
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("marshaling request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api-free.deepl.com/v2/translate", bytes.NewReader(jsonBody))
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Authorization", "DeepL-Auth-Key "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("calling DeepL API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading DeepL response: %w", err)
	}

	switch resp.StatusCode {
	case http.StatusOK:
		// success, handled below
	case http.StatusForbidden, http.StatusUnauthorized:
		return "", ErrDeepLUnauthorized
	case http.StatusTooManyRequests:
		return "", ErrDeepLRateLimit
	case 456: // DeepL quota exceeded
		return "", ErrDeepLQuotaExceeded
	default:
		if resp.StatusCode >= 500 {
			return "", ErrDeepLUnavailable
		}
		return "", fmt.Errorf("DeepL API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var deeplResp deeplResponse
	if err := json.Unmarshal(respBody, &deeplResp); err != nil {
		return "", fmt.Errorf("decoding DeepL response: %w", err)
	}

	if len(deeplResp.Translations) == 0 {
		return "", fmt.Errorf("DeepL returned no translations")
	}

	return deeplResp.Translations[0].Text, nil
}

func (s *translatorService) GetHistory(ctx context.Context, limit int) ([]domain.Translation, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.repo.GetHistory(ctx, limit)
}
