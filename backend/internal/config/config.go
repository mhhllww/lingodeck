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
	}
}
