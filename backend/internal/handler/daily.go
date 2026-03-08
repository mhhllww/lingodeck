package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/mhlw/lingodeck/internal/domain"
)

type DailyHandler struct {
	svc domain.DailyService
}

func NewDailyHandler(svc domain.DailyService) *DailyHandler {
	return &DailyHandler{svc: svc}
}

func (h *DailyHandler) GetWordOfTheDay(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok {
		respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	resp, err := h.svc.GetWordOfTheDay(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	if resp == nil {
		respondError(w, http.StatusNotFound, "NOT_FOUND", "no word of the day yet")
		return
	}

	respondJSON(w, http.StatusOK, resp)
}

func (h *DailyHandler) AddWordOfTheDay(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok {
		respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	var body struct {
		DeckID int `json:"deck_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.DeckID == 0 {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "deck_id required")
		return
	}

	if err := h.svc.AddWordOfTheDayToDecks(r.Context(), userID, body.DeckID); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			respondError(w, http.StatusNotFound, "NOT_FOUND", "no word of the day")
			return
		}
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

func (h *DailyHandler) GetDailyMix(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok {
		respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	resp, err := h.svc.GetDailyMix(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	// Return empty structure instead of null
	if resp.Cards == nil {
		resp.Cards = []domain.Card{}
	}

	respondJSON(w, http.StatusOK, resp)
}
