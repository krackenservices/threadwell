# === Variables ===
APP_NAME=threadwell
CMD_DIR=cmd/${APP_NAME}
OUTPUT_DIR=bin

GOFILES=$(shell find . -type f -name '*.go' -not -path "./vendor/*")

# === Default ===
.PHONY: all
all: build

# === Debug (with air or fallback) ===
.PHONY: debug
debug:
	@command -v air >/dev/null 2>&1 && air || go run $(CMD_DIR)/main.go

# === Swagger (via swaggo) ===
.PHONY: swagger
swagger:
	swag init --generalInfo $(CMD_DIR)/main.go --output ./docs

# === Build for local OS ===
.PHONY: build
build:
	@mkdir -p $(OUTPUT_DIR)
	GOOS=$(shell go env GOOS) GOARCH=$(shell go env GOARCH) go build -o $(OUTPUT_DIR)/$(APP_NAME) $(CMD_DIR)/main.go

# === Build for all major targets ===
.PHONY: build-all
build-all:
	@mkdir -p $(OUTPUT_DIR)
	GOOS=linux   GOARCH=amd64   go build -o $(OUTPUT_DIR)/$(APP_NAME)-linux-amd64     $(CMD_DIR)/main.go
	GOOS=linux   GOARCH=arm64   go build -o $(OUTPUT_DIR)/$(APP_NAME)-linux-arm64     $(CMD_DIR)/main.go
	GOOS=darwin  GOARCH=amd64   go build -o $(OUTPUT_DIR)/$(APP_NAME)-darwin-amd64    $(CMD_DIR)/main.go
	GOOS=darwin  GOARCH=arm64   go build -o $(OUTPUT_DIR)/$(APP_NAME)-darwin-arm64    $(CMD_DIR)/main.go
	GOOS=windows GOARCH=amd64   go build -o $(OUTPUT_DIR)/$(APP_NAME)-windows-amd64.exe $(CMD_DIR)/main.go

.PHONY: build-docker
build-docker:
	@docker build -t backend:latest .

# === Clean ===
.PHONY: clean
clean:
	rm -rf $(OUTPUT_DIR)
