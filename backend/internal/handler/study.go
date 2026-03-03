package handler

import (
	"encoding/json"
	"net/http"

	"github.com/mhlw/lingodeck/internal/domain"
	"github.com/mhlw/lingodeck/internal/service"
)

type StudyHandler struct {
	svc service.CardService
}

func NewStudyHandler(svc service.CardService) *StudyHandler {
	return &StudyHandler{svc: svc}
}

type studyResultRequest struct {
	CardID  string `json:"card_id"`
	Correct bool   `json:"correct"`
}

type saveResultsRequest struct {
	CardResults []studyResultRequest `json:"card_results"`
}

// SaveResults godoc
// @Summary Save study session results
// @Tags study
// @Accept json
// @Param body body saveResultsRequest true "Study results"
// @Success 204
// @Failure 400 {object} errorBody
// @Router /api/study/results [post]
func (h *StudyHandler) SaveResults(w http.ResponseWriter, r *http.Request) {
	var req saveResultsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	if len(req.CardResults) == 0 {
		respondError(w, http.StatusBadRequest, "BAD_REQUEST", "card_results must not be empty")
		return
	}

	results := make([]domain.StudyCardResult, len(req.CardResults))
	for i, cr := range req.CardResults {
		id, err := parseStringID(cr.CardID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid card_id: "+cr.CardID)
			return
		}
		results[i] = domain.StudyCardResult{CardID: id, Correct: cr.Correct}
	}

	if err := h.svc.SaveStudyResults(r.Context(), results); err != nil {
		respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to save study results")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
