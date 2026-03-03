package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/mhlw/lingodeck/internal/domain"
	"github.com/mhlw/lingodeck/internal/service"
)

type CardHandler struct {
	svc service.CardService
}

func NewCardHandler(svc service.CardService) *CardHandler {
	return &CardHandler{svc: svc}
}

// ListCards godoc
// @Summary List cards in a deck
// @Tags cards
// @Param deckId path int true "Deck ID"
// @Success 200 {array} CardResponse
// @Failure 500 {object} errorBody
// @Router /api/decks/{deckId}/cards [get]
func (h *CardHandler) ListCards(w http.ResponseWriter, r *http.Request) {
	deckID, err := strconv.Atoi(r.PathValue("deckId"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid deck id")
		return
	}

	cards, err := h.svc.ListByDeck(r.Context(), deckID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to list cards")
		return
	}

	respondJSON(w, http.StatusOK, toCardResponses(cards))
}

// ListAllCards godoc
// @Summary List all cards with optional filters
// @Tags cards
// @Param deck_id query int false "Deck ID filter"
// @Param q query string false "Search query"
// @Success 200 {array} CardResponse
// @Failure 500 {object} errorBody
// @Router /api/cards [get]
func (h *CardHandler) ListAllCards(w http.ResponseWriter, r *http.Request) {
	var deckID *int
	if v := r.URL.Query().Get("deck_id"); v != "" {
		id, err := strconv.Atoi(v)
		if err != nil {
			respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid deck_id")
			return
		}
		deckID = &id
	}
	query := r.URL.Query().Get("q")

	cards, err := h.svc.ListCards(r.Context(), deckID, query)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to list cards")
		return
	}

	respondJSON(w, http.StatusOK, toCardResponses(cards))
}

// GetCard godoc
// @Summary Get a card by ID
// @Tags cards
// @Param id path int true "Card ID"
// @Success 200 {object} CardResponse
// @Failure 404 {object} errorBody
// @Router /api/cards/{id} [get]
func (h *CardHandler) GetCard(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid card id")
		return
	}

	card, err := h.svc.GetCard(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to get card")
		return
	}
	if card == nil {
		respondError(w, http.StatusNotFound, "NOT_FOUND", "card not found")
		return
	}

	respondJSON(w, http.StatusOK, toCardResponse(*card))
}

// CreateCard godoc
// @Summary Add card to deck (nested route)
// @Tags cards
// @Param deckId path int true "Deck ID"
// @Param body body domain.Card true "Card data"
// @Success 201 {object} CardResponse
// @Failure 400 {object} errorBody
// @Router /api/decks/{deckId}/cards [post]
func (h *CardHandler) CreateCard(w http.ResponseWriter, r *http.Request) {
	deckID, err := strconv.Atoi(r.PathValue("deckId"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid deck id")
		return
	}

	var c domain.Card
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	c.DeckID = deckID

	if err := h.svc.CreateCard(r.Context(), &c); err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create card")
		return
	}

	respondJSON(w, http.StatusCreated, toCardResponse(c))
}

// CreateCardFlat godoc
// @Summary Create a card (flat route, deck_id from body)
// @Tags cards
// @Param body body domain.Card true "Card data with deck_id"
// @Success 201 {object} CardResponse
// @Failure 400 {object} errorBody
// @Router /api/cards [post]
func (h *CardHandler) CreateCardFlat(w http.ResponseWriter, r *http.Request) {
	var c domain.Card
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	if c.DeckID == 0 {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "deck_id is required")
		return
	}

	if err := h.svc.CreateCard(r.Context(), &c); err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create card")
		return
	}

	respondJSON(w, http.StatusCreated, toCardResponse(c))
}

// UpdateCard godoc
// @Summary Update a card
// @Tags cards
// @Param id path int true "Card ID"
// @Param body body domain.Card true "Card data"
// @Success 200 {object} CardResponse
// @Failure 400 {object} errorBody
// @Router /api/cards/{id} [put]
func (h *CardHandler) UpdateCard(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid card id")
		return
	}

	var c domain.Card
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	c.ID = id

	if err := h.svc.UpdateCard(r.Context(), &c); err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to update card")
		return
	}

	respondJSON(w, http.StatusOK, toCardResponse(c))
}

// DeleteCard godoc
// @Summary Delete a card
// @Tags cards
// @Param id path int true "Card ID"
// @Success 204
// @Failure 500 {object} errorBody
// @Router /api/cards/{id} [delete]
func (h *CardHandler) DeleteCard(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid card id")
		return
	}

	if err := h.svc.DeleteCard(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to delete card")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
