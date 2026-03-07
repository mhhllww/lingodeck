package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	DeepLAPIKey string
	GroqAPIKey  string

	JWTSecret          string
	JWTSecureCookie    bool
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	ResendAPIKey string
	EmailFrom    string
	AppURL       string
}

func Load() *Config {
	godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		Port:        port,
		DatabaseURL: os.Getenv("DATABASE_URL"),
		DeepLAPIKey: os.Getenv("DEEPL_API_KEY"),
		GroqAPIKey:  os.Getenv("GROQ_API_KEY"),

		JWTSecret:          os.Getenv("JWT_SECRET"),
		JWTSecureCookie:    os.Getenv("JWT_SECURE_COOKIE") == "true",
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL: os.Getenv("GOOGLE_REDIRECT_URL"),

		ResendAPIKey: os.Getenv("RESEND_API_KEY"),
		EmailFrom:    os.Getenv("EMAIL_FROM"),
		AppURL:       os.Getenv("APP_URL"),
	}
}
