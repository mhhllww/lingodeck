package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/mhlw/lingodeck/internal/service"
)

type TranslatorHandler struct {
	svc service.TranslatorService
}

func NewTranslatorHandler(svc service.TranslatorService) *TranslatorHandler {
	return &TranslatorHandler{svc: svc}
}

type translateRequest struct {
	Text       string `json:"text"`
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
}

// Translate godoc
// @Summary Translate text
// @Tags translator
// @Accept json
// @Produce json
// @Param body body translateRequest true "Translation request"
// @Success 200 {object} domain.Translation
// @Failure 400 {object} errorBody
// @Failure 500 {object} errorBody
// @Router /api/translate [post]
func (h *TranslatorHandler) Translate(w http.ResponseWriter, r *http.Request) {
	var req translateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	if req.Text == "" || req.SourceLang == "" || req.TargetLang == "" {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "text, source_lang, and target_lang are required")
		return
	}

	t, err := h.svc.Translate(r.Context(), req.Text, req.SourceLang, req.TargetLang)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrDeepLUnauthorized):
			respondError(w, http.StatusBadGateway, "TRANSLATION_ERROR", "translation service authentication failed")
		case errors.Is(err, service.ErrDeepLRateLimit):
			respondError(w, http.StatusTooManyRequests, "RATE_LIMIT", "translation rate limit exceeded, try again later")
		case errors.Is(err, service.ErrDeepLQuotaExceeded):
			respondError(w, http.StatusServiceUnavailable, "QUOTA_EXCEEDED", "translation quota exceeded")
		case errors.Is(err, service.ErrDeepLUnavailable):
			respondError(w, http.StatusBadGateway, "SERVICE_UNAVAILABLE", "translation service temporarily unavailable")
		default:
			slog.Error("translation failed", "error", err)
			respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to translate")
		}
		return
	}

	respondJSON(w, http.StatusOK, t)
}

// History godoc
// @Summary Get translation history
// @Tags translator
// @Produce json
// @Success 200 {array} domain.Translation
// @Failure 500 {object} errorBody
// @Router /api/translate/history [get]
func (h *TranslatorHandler) History(w http.ResponseWriter, r *http.Request) {
	translations, err := h.svc.GetHistory(r.Context(), 20)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to get history")
		return
	}

	respondJSON(w, http.StatusOK, translations)
}
