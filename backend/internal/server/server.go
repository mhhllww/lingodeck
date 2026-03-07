package server

import (
	"net/http"

	"github.com/mhlw/lingodeck/internal/domain"
	"github.com/mhlw/lingodeck/internal/handler"
	"github.com/mhlw/lingodeck/internal/service"

	httpSwagger "github.com/swaggo/http-swagger"
)

func New(
	dictSvc service.DictionaryService,
	transSvc service.TranslatorService,
	cardSvc service.CardService,
	authSvc domain.AuthService,
	secureCookie bool,
) http.Handler {
	mux := http.NewServeMux()

	dictH := handler.NewDictionaryHandler(dictSvc)
	transH := handler.NewTranslatorHandler(transSvc)
	cardH := handler.NewCardHandler(cardSvc)
	deckH := handler.NewDeckHandler(cardSvc)
	studyH := handler.NewStudyHandler(cardSvc)
	authH := handler.NewAuthHandler(authSvc, secureCookie)

	auth := authH.AuthMiddleware

	// Auth — public
	mux.HandleFunc("POST /api/auth/register", authH.Register)
	mux.HandleFunc("POST /api/auth/login", authH.Login)
	mux.HandleFunc("POST /api/auth/logout", authH.Logout)
	mux.HandleFunc("POST /api/auth/refresh", authH.Refresh)
	mux.HandleFunc("POST /api/auth/verify-email", authH.VerifyEmail)
	mux.HandleFunc("POST /api/auth/forgot-password", authH.ForgotPassword)
	mux.HandleFunc("POST /api/auth/reset-password", authH.ResetPassword)
	mux.HandleFunc("POST /api/auth/resend-verification", authH.ResendVerification)
	mux.HandleFunc("GET /api/auth/google", authH.GoogleAuth)
	mux.HandleFunc("GET /api/auth/google/callback", authH.GoogleCallback)

	// Auth — protected
	mux.Handle("GET /api/auth/me", auth(http.HandlerFunc(authH.Me)))

	// Dictionary — protected
	mux.Handle("GET /api/dictionary/search", auth(http.HandlerFunc(dictH.Search)))
	mux.Handle("GET /api/dictionary/words/{id}", auth(http.HandlerFunc(dictH.GetWord)))

	// Translator — protected
	mux.Handle("POST /api/translate", auth(http.HandlerFunc(transH.Translate)))
	mux.Handle("GET /api/translate/history", auth(http.HandlerFunc(transH.History)))

	// Decks — protected
	mux.Handle("GET /api/decks", auth(http.HandlerFunc(deckH.ListDecks)))
	mux.Handle("POST /api/decks", auth(http.HandlerFunc(deckH.CreateDeck)))
	mux.Handle("GET /api/decks/{id}", auth(http.HandlerFunc(deckH.GetDeck)))
	mux.Handle("PUT /api/decks/{id}", auth(http.HandlerFunc(deckH.UpdateDeck)))
	mux.Handle("DELETE /api/decks/{id}", auth(http.HandlerFunc(deckH.DeleteDeck)))

	// Cards (nested under deck) — protected
	mux.Handle("GET /api/decks/{deckId}/cards", auth(http.HandlerFunc(cardH.ListCards)))
	mux.Handle("POST /api/decks/{deckId}/cards", auth(http.HandlerFunc(cardH.CreateCard)))

	// Cards (flat) — protected
	mux.Handle("GET /api/cards", auth(http.HandlerFunc(cardH.ListAllCards)))
	mux.Handle("GET /api/cards/{id}", auth(http.HandlerFunc(cardH.GetCard)))
	mux.Handle("POST /api/cards", auth(http.HandlerFunc(cardH.CreateCardFlat)))
	mux.Handle("PUT /api/cards/{id}", auth(http.HandlerFunc(cardH.UpdateCard)))
	mux.Handle("DELETE /api/cards/{id}", auth(http.HandlerFunc(cardH.DeleteCard)))

	// Study — protected
	mux.Handle("POST /api/study/results", auth(http.HandlerFunc(studyH.SaveResults)))

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
