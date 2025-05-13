FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download && go install github.com/swaggo/swag/cmd/swag@v1.8.4

COPY . .

RUN swag init --generalInfo cmd/threadwell/main.go --output docs
RUN go build -o threadwell ./cmd/threadwell/main.go

FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/threadwell .
COPY --from=builder /app/docs ./docs

RUN mkdir -p /app/data

EXPOSE 8001

ENTRYPOINT ["./threadwell"]
