//go:generate swag init -g main.go -d ../../ -o ../../docs

// @title LingoDeck API
// @version 1.0
// @description REST API for LingoDeck — an English learning app
// @host localhost:8080
// @BasePath /
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mhlw/lingodeck/internal/config"
	"github.com/mhlw/lingodeck/internal/repository/postgres"
	"github.com/mhlw/lingodeck/internal/server"
	"github.com/mhlw/lingodeck/internal/service"

	_ "github.com/mhlw/lingodeck/docs"
)

func main() {
	cfg := config.Load()

	// Database
	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		slog.Error("failed to ping database", "error", err)
		os.Exit(1)
	}
	slog.Info("connected to database")

	// Migrations
	m, err := migrate.New("file://migrations", cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to create migrator", "error", err)
		os.Exit(1)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}
	slog.Info("migrations applied")

	// Repositories
	wordRepo := postgres.NewWordRepo(pool)
	translationRepo := postgres.NewTranslationRepo(pool)
	cardRepo := postgres.NewCardRepo(pool)
	deckRepo := postgres.NewDeckRepo(pool)
	userRepo := postgres.NewUserRepo(pool)
	dailyRepo := postgres.NewDailyRepo(pool)

	// Services
	groqSvc := service.NewGroqService(cfg.GroqAPIKey)
	dictSvc := service.NewDictionaryService(wordRepo, groqSvc)
	transSvc := service.NewTranslatorService(translationRepo, cfg.DeepLAPIKey)
	cardSvc := service.NewCardService(cardRepo, deckRepo)
	emailSvc := service.NewEmailService(cfg.ResendAPIKey, cfg.EmailFrom, cfg.AppURL)
	authSvc := service.NewAuthService(userRepo, userRepo, emailSvc, cfg.JWTSecret, cfg.GoogleClientID, cfg.GoogleClientSecret, cfg.GoogleRedirectURL)
	dailySvc := service.NewDailyService(dailyRepo, deckRepo, cardRepo)

	// Server
	handler := server.New(dictSvc, transSvc, cardSvc, authSvc, dailySvc, cfg.JWTSecureCookie)
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		slog.Info("server starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-done
	slog.Info("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("server shutdown error", "error", err)
	}

	pool.Close()
	slog.Info("server stopped")
}
