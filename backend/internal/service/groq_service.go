package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/mhlw/lingodeck/internal/domain"
)

const (
	groqAPIURL = "https://api.groq.com/openai/v1/chat/completions"
	groqModel  = "llama-3.3-70b-versatile"
)

type GroqService struct {
	client *http.Client
	apiKey string
}

func NewGroqService(apiKey string) *GroqService {
	return &GroqService{
		apiKey: apiKey,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type groqRequest struct {
	Model    string        `json:"model"`
	Messages []groqMessage `json:"messages"`
}

type groqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type groqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type groqWordResult struct {
	Transcription string   `json:"transcription"`
	PartOfSpeech  string   `json:"part_of_speech"`
	Definitions   []string `json:"definitions"`
	Examples      []string `json:"examples"`
	Synonyms      []string `json:"synonyms"`
}

const groqPrompt = `You are a dictionary API. For the given English word, return a JSON object with exactly this structure:
{
"transcription": "IPA transcription",
"part_of_speech": "noun|verb|adjective|adverb|etc",
"definitions": ["definition 1", "definition 2"],
"examples": ["example sentence 1", "example sentence 2"],
"synonyms": ["synonym1", "synonym2", "synonym3"]
}

Rules:
- transcription must be in IPA format with slashes, e.g. /ɪˈfem.ər.əl/
- definitions: 1-3 short English definitions
- examples: 2-3 natural example sentences using the word
- synonyms: 3-5 English synonyms
- Return ONLY valid JSON, no markdown, no explanation, no backticks

Word: %s`

func (s *GroqService) GenerateWordOfTheDay(ctx context.Context, exclude []string) (string, error) {
	excludeStr := strings.Join(exclude, ", ")
	prompt := fmt.Sprintf(
		"Give me one advanced English word suitable for vocabulary learning. "+
			"Do not use any of these words: %s. "+
			"Return only the word, nothing else.",
		excludeStr,
	)

	reqBody := groqRequest{
		Model: groqModel,
		Messages: []groqMessage{
			{Role: "user", Content: prompt},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshaling groq request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, groqAPIURL, bytes.NewReader(jsonBody))
	if err != nil {
		return "", fmt.Errorf("creating groq request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
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

	word := strings.TrimSpace(groqResp.Choices[0].Message.Content)
	word = strings.ToLower(word)
	return word, nil
}

func (s *GroqService) EnrichWord(ctx context.Context, word string) (*domain.Word, error) {
	reqBody := groqRequest{
		Model: groqModel,
		Messages: []groqMessage{
			{Role: "user", Content: fmt.Sprintf(groqPrompt, word)},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshaling groq request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, groqAPIURL, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("creating groq request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("calling Groq API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading Groq response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Groq API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var groqResp groqResponse
	if err := json.Unmarshal(respBody, &groqResp); err != nil {
		return nil, fmt.Errorf("decoding Groq response: %w", err)
	}

	if len(groqResp.Choices) == 0 {
		return nil, fmt.Errorf("Groq returned no choices")
	}

	content := strings.TrimSpace(groqResp.Choices[0].Message.Content)

	var result groqWordResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return nil, fmt.Errorf("parsing Groq word data: %w", err)
	}

	return &domain.Word{
		Word:          word,
		Transcription: result.Transcription,
		PartOfSpeech:  result.PartOfSpeech,
		Definitions:   result.Definitions,
		Examples:      result.Examples,
		Synonyms:      result.Synonyms,
	}, nil
}
