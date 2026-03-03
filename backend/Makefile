.PHONY: run build migrate-up migrate-down swagger

run:
	go run ./cmd/api

build:
	go build -o bin/lingodeck ./cmd/api

migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down

swagger:
	swag init -g cmd/api/main.go -o docs
