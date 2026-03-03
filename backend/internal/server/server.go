package server

import (
	"net/http"

	"github.com/mhlw/lingodeck/internal/handler"
	"github.com/mhlw/lingodeck/internal/service"

	httpSwagger "github.com/swaggo/http-swagger"
)

func New(
	dictSvc service.DictionaryService,
	transSvc service.TranslatorService,
	cardSvc service.CardService,
) http.Handler {
	mux := http.NewServeMux()

	dictH := handler.NewDictionaryHandler(dictSvc)
	transH := handler.NewTranslatorHandler(transSvc)
	cardH := handler.NewCardHandler(cardSvc)
	deckH := handler.NewDeckHandler(cardSvc)
	studyH := handler.NewStudyHandler(cardSvc)

	// Dictionary
	mux.HandleFunc("GET /api/dictionary/search", dictH.Search)
	mux.HandleFunc("GET /api/dictionary/words/{id}", dictH.GetWord)

	// Translator
	mux.HandleFunc("POST /api/translate", transH.Translate)
	mux.HandleFunc("GET /api/translate/history", transH.History)

	// Decks
	mux.HandleFunc("GET /api/decks", deckH.ListDecks)
	mux.HandleFunc("POST /api/decks", deckH.CreateDeck)
	mux.HandleFunc("GET /api/decks/{id}", deckH.GetDeck)
	mux.HandleFunc("PUT /api/decks/{id}", deckH.UpdateDeck)
	mux.HandleFunc("DELETE /api/decks/{id}", deckH.DeleteDeck)

	// Cards (nested under deck)
	mux.HandleFunc("GET /api/decks/{deckId}/cards", cardH.ListCards)
	mux.HandleFunc("POST /api/decks/{deckId}/cards", cardH.CreateCard)

	// Cards (flat)
	mux.HandleFunc("GET /api/cards", cardH.ListAllCards)
	mux.HandleFunc("GET /api/cards/{id}", cardH.GetCard)
	mux.HandleFunc("POST /api/cards", cardH.CreateCardFlat)
	mux.HandleFunc("PUT /api/cards/{id}", cardH.UpdateCard)
	mux.HandleFunc("DELETE /api/cards/{id}", cardH.DeleteCard)

	// Study
	mux.HandleFunc("POST /api/study/results", studyH.SaveResults)

	// Swagger
	mux.Handle("GET /swagger/", httpSwagger.WrapHandler)

	// Middleware stack
	var h http.Handler = mux
	h = handler.ContentType(h)
	h = handler.CORS(h)
	h = handler.Logging(h)
	h = handler.Recovery(h)

	return h
}
