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
    mux.HandleFunc("/api/threads/", threadDeleteHandler)
    mux.HandleFunc("/api/messages", messagesHandler)
    mux.HandleFunc("/api/messages/", messageIDHandler)
    mux.HandleFunc("/api/move/", moveHandler)
    mux.HandleFunc("/health", healthHandler)
    mux.HandleFunc("/version", versionHandler)
}

// healthHandler provides a simple liveness check
// @Summary Health check
// @Tags meta
// @Success 200 {object} map[string]string
// @Router /health [get]
func healthHandler(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// versionHandler returns build info
// @Summary API version info
// @Tags meta
// @Success 200 {object} map[string]string
// @Router /version [get]
func versionHandler(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]string{
        "version": "0.1.0",
        "name":    "threadwell",
    })
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

// messagesHandler handles GET/POST for messages
// @Summary List or create messages
// @Tags messages
// @Accept json
// @Produce json
// @Param threadId query string true "Thread ID to filter messages"
// @Success 200 {array} models.Message
// @Failure 500 {object} map[string]string
// @Router /api/messages [get]
func messagesHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method == http.MethodGet {
        threadID := r.URL.Query().Get("threadId")
        if threadID == "" {
            http.Error(w, `{"error":"threadId is required"}`, http.StatusBadRequest)
            return
        }
        msgs, err := backend.ListMessages(threadID)
        if err != nil {
            http.Error(w, `{"error":"failed to fetch messages"}`, http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(msgs)
        return
    }

    if r.Method == http.MethodPost {
        var m models.Message
        if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
            http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
            return
        }
        if m.ID == "" {
            m.ID = "gen-" + RandID()
        }
        if m.Timestamp == 0 {
            m.Timestamp = UnixNow()
        }
        if err := backend.CreateMessage(m); err != nil {
            http.Error(w, `{"error":"failed to save message"}`, http.StatusInternalServerError)
            return
        }
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(m)
        return
    }

    http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
}

// moveHandler handles subtree move
// @Summary Move a message and its descendants to a new thread
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Message ID to move"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/move/{id} [post]
func moveHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
        return
    }

    // extract ID from /api/move/{id}
    id := r.URL.Path[len("/api/move/"):]
    if id == "" {
        http.Error(w, `{"error":"id required"}`, http.StatusBadRequest)
        return
    }

    newThreadID, err := backend.MoveSubtree(id)
    if err != nil {
        http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"thread_id": newThreadID})
}

// threadDeleteHandler handles DELETE /api/threads/{id}
// @Summary Delete a thread and its messages
// @Tags threads
// @Produce json
// @Param id path string true "Thread ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/threads/{id} [delete]
func threadDeleteHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodDelete {
        http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
        return
    }

    id := r.URL.Path[len("/api/threads/"):]
    if id == "" {
        http.Error(w, `{"error":"id required"}`, http.StatusBadRequest)
        return
    }

    if err := backend.DeleteThread(id); err != nil {
        http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"deleted": id})
}

// messageIDHandler handles GET, PUT, DELETE for /api/messages/{id}
// @Summary Get, update or delete a message by ID
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Message ID"
// @Success 200 {object} models.Message
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/messages/{id} [get]
// @Router /api/messages/{id} [put]
// @Router /api/messages/{id} [delete]
func messageIDHandler(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Path[len("/api/messages/"):]
    if id == "" {
        http.Error(w, `{"error":"id required"}`, http.StatusBadRequest)
        return
    }

    switch r.Method {
    case http.MethodGet:
        msg, err := backend.GetMessage(id)
        if err != nil {
            http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
            return
        }
        if msg == nil {
            http.Error(w, `{"error":"message not found"}`, http.StatusNotFound)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(msg)

    case http.MethodPut:
        var m models.Message
        if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
            http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
            return
        }
        m.ID = id
        if err := backend.DeleteMessage(id); err != nil {
            http.Error(w, `{"error":"could not delete old message"}`, http.StatusInternalServerError)
            return
        }
        if err := backend.CreateMessage(m); err != nil {
            http.Error(w, `{"error":"failed to update message"}`, http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(m)

    case http.MethodDelete:
        if err := backend.DeleteMessage(id); err != nil {
            http.Error(w, `{"error":"failed to delete"}`, http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"deleted": id})

    default:
        http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
    }
}

