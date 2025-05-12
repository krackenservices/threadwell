package api

import (
    "encoding/json"
    "net/http"

    "github.com/krackenservices/threadwell/models"
    "github.com/krackenservices/threadwell/storage"
)

var backend storage.Storage

// RegisterRoutes registers API handlers
func RegisterRoutes(mux *http.ServeMux, s storage.Storage) {
    backend = s
    mux.HandleFunc("/api/threads", threadsHandler)
}

// threadsHandler handles GET/POST threads
// @Summary List or create threads
// @Tags threads
// @Accept json
// @Produce json
// @Success 200 {array} models.Thread
// @Failure 500 {object} map[string]string
// @Router /api/threads [get]
func threadsHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method == http.MethodGet {
        threads, err := backend.ListThreads()
        if err != nil {
            http.Error(w, `{"error":"failed to fetch threads"}`, http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(threads)
        return
    }

    if r.Method == http.MethodPost {
        var t models.Thread
        if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
            http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
            return
        }
        if t.ID == "" {
            t.ID = "gen-" + RandID()
        }
        if t.CreatedAt == 0 {
            t.CreatedAt = UnixNow()
        }
        if err := backend.CreateThread(t); err != nil {
            http.Error(w, `{"error":"failed to save thread"}`, http.StatusInternalServerError)
            return
        }
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(t)
        return
    }

    http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
}