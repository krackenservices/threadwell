# === Variables ===
APP_NAME=threadwell
CMD_DIR=cmd/${APP_NAME}
OUTPUT_DIR=bin

GOFILES=$(shell find . -type f -name '*.go' -not -path "./vendor/*")

SWAG_VER := $(shell awk '/swaggo\/swag/ {print $$2}' go.mod)
SWAG_VERSION := $(shell swag --version 2>/dev/null | awk '{print $$3}')

# === Default ===
.PHONY: all
all: build

.PHONY: run
run: swagger
	go run $(CMD_DIR)/main.go
# === Debug (with air or fallback) ===
.PHONY: debug
debug:
	@command -v air >/dev/null 2>&1 && air || go run $(CMD_DIR)/main.go

# === Swagger (via swaggo) ===
.PHONY: installSwagger swagger

installSwagger:
ifeq ($(strip $(SWAG_VERSION)),)
	@echo "Swag not found - Installing latest recommended version based on go.mod (${SWAG_VER}):"
	go install github.com/swaggo/swag/cmd/swag@${SWAG_VER}
else
	@echo "Found Swag version: ${SWAG_VERSION}"
ifeq ($(strip $(SWAG_VER)),$(strip $(SWAG_VERSION)))
	@echo "Swag version is up-to-date."
else
	@echo "Version mismatch: Got '${SWAG_VERSION}' expected '${SWAG_VER}'."
	go install github.com/swaggo/swag/cmd/swag@${SWAG_VER}

endif
endif
	@echo "$(shell swag --version)"

swagger: installSwagger
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

# === Test ===
.PHONY: test
test: lint
	@echo "Running tests..."
	@go test -v ./... -coverprofile=coverage.out
	@echo "Tests completed."

# === Lint ===
.PHONY: lint
lint:
	@echo "Running linter..."
	@go vet ./...
	@go fmt ./...
	@golangci-lint run --timeout 5m
	@echo "Linting completed."
# === Clean ===
.PHONY: clean
clean:
	rm -rf $(OUTPUT_DIR)
