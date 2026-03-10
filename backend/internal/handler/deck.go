package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/mhlw/lingodeck/internal/domain"
	"github.com/mhlw/lingodeck/internal/service"
)

type DeckHandler struct {
	svc service.CardService
}

func NewDeckHandler(svc service.CardService) *DeckHandler {
	return &DeckHandler{svc: svc}
}

// ListDecks godoc
// @Summary List all decks
// @Tags decks
// @Produce json
// @Success 200 {array} DeckResponse
// @Failure 500 {object} errorBody
// @Router /api/decks [get]
func (h *DeckHandler) ListDecks(w http.ResponseWriter, r *http.Request) {
	decks, err := h.svc.ListDecks(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to list decks")
		return
	}

	respondJSON(w, http.StatusOK, toDeckResponses(decks))
}

// CreateDeck godoc
// @Summary Create a new deck
// @Tags decks
// @Accept json
// @Produce json
// @Param body body domain.Deck true "Deck data"
// @Success 201 {object} DeckResponse
// @Failure 400 {object} errorBody
// @Router /api/decks [post]
func (h *DeckHandler) CreateDeck(w http.ResponseWriter, r *http.Request) {
	var d domain.Deck
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	if d.Name == "" {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "name is required")
		return
	}

	if err := h.svc.CreateDeck(r.Context(), &d); err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create deck")
		return
	}

	respondJSON(w, http.StatusCreated, toDeckResponse(d))
}

// GetDeck godoc
// @Summary Get deck by ID with card count
// @Tags decks
// @Param id path int true "Deck ID"
// @Success 200 {object} DeckResponse
// @Failure 404 {object} errorBody
// @Router /api/decks/{id} [get]
func (h *DeckHandler) GetDeck(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid deck id")
		return
	}

	deck, err := h.svc.GetDeck(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to get deck")
		return
	}
	if deck == nil {
		respondError(w, http.StatusNotFound, "NOT_FOUND", "deck not found")
		return
	}

	respondJSON(w, http.StatusOK, toDeckResponse(*deck))
}

// UpdateDeck godoc
// @Summary Update a deck
// @Tags decks
// @Accept json
// @Produce json
// @Param id path int true "Deck ID"
// @Param body body domain.Deck true "Deck data"
// @Success 200 {object} DeckResponse
// @Failure 400 {object} errorBody
// @Router /api/decks/{id} [put]
func (h *DeckHandler) UpdateDeck(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid deck id")
		return
	}

	var d domain.Deck
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	d.ID = id

	if err := h.svc.UpdateDeck(r.Context(), &d); err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to update deck")
		return
	}

	respondJSON(w, http.StatusOK, toDeckResponse(d))
}

// DeleteDeck godoc
// @Summary Delete a deck
// @Tags decks
// @Param id path int true "Deck ID"
// @Success 204
// @Failure 500 {object} errorBody
// @Router /api/decks/{id} [delete]
func (h *DeckHandler) DeleteDeck(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid deck id")
		return
	}

	keepCards := r.URL.Query().Get("keep_cards") == "true"

	if keepCards {
		// Detach cards from deck before deleting
		if err := h.svc.DetachCardsFromDeck(r.Context(), id); err != nil {
			respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to detach cards")
			return
		}
	}

	if err := h.svc.DeleteDeck(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to delete deck")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
