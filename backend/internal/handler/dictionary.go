package handler

import (
	"net/http"
	"strconv"

	"github.com/mhlw/lingodeck/internal/service"
)

type DictionaryHandler struct {
	svc service.DictionaryService
}

func NewDictionaryHandler(svc service.DictionaryService) *DictionaryHandler {
	return &DictionaryHandler{svc: svc}
}

// Search godoc
// @Summary Search words in dictionary
// @Tags dictionary
// @Param q query string true "Search query"
// @Success 200 {array} domain.Word
// @Failure 400 {object} errorBody
// @Failure 500 {object} errorBody
// @Router /api/dictionary/search [get]
func (h *DictionaryHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "query parameter 'q' is required")
		return
	}

	words, err := h.svc.Search(r.Context(), q)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to search words")
		return
	}

	respondJSON(w, http.StatusOK, words)
}

// GetWord godoc
// @Summary Get word by ID
// @Tags dictionary
// @Param id path int true "Word ID"
// @Success 200 {object} domain.Word
// @Failure 404 {object} errorBody
// @Failure 500 {object} errorBody
// @Router /api/dictionary/words/{id} [get]
func (h *DictionaryHandler) GetWord(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid word id")
		return
	}

	word, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to get word")
		return
	}
	if word == nil {
		respondError(w, http.StatusNotFound, "NOT_FOUND", "word not found")
		return
	}

	respondJSON(w, http.StatusOK, word)
}
