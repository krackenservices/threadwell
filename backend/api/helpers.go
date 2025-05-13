package api

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"time"
)

func RandID() string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func UnixNow() int64 {
	return time.Now().Unix()
}

// WriteJSON writes a JSON response with the given status code and payload.
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			http.Error(w, "internal json encoding error", http.StatusInternalServerError)
		}
	}
}

// WriteError sends a structured JSON error message.
func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, map[string]interface{}{
		"error": message,
		"code":  status,
	})
}
