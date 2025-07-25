package api

import (
	"encoding/json"
	"net/http"

	"github.com/krackenservices/threadwell/models"
	"github.com/krackenservices/threadwell/storage"
)

// Handler bundles the HTTP mux and storage implementation.
type Handler struct {
	mux     *http.ServeMux
	backend storage.Storage
}

// ServeHTTP satisfies http.Handler by delegating to the internal mux.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.mux.ServeHTTP(w, r)
}

// RegisterRoutes builds and returns an http.Handler for the API.
func RegisterRoutes(s storage.Storage) http.Handler {
	h := &Handler{backend: s, mux: http.NewServeMux()}
	h.mux.HandleFunc("/api/threads", h.threadsHandler)
	h.mux.HandleFunc("/api/threads/", h.threadIDHandler)
	h.mux.HandleFunc("/api/messages", h.messagesHandler)
	h.mux.HandleFunc("/api/messages/", h.messageIDHandler)
	h.mux.HandleFunc("/api/move/", h.moveHandler)
	h.mux.HandleFunc("/health", healthHandler)
	h.mux.HandleFunc("/version", versionHandler)
	h.mux.HandleFunc("/api/settings", h.settingsHandler)
	return h
}

// healthHandler provides a simple liveness check
// @Summary Health check
// @Tags meta
// @Success 200 {object} map[string]string
// @Router /health [get]
func healthHandler(w http.ResponseWriter, r *http.Request) {
	err := json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	if err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// versionHandler returns build info
// @Summary API version info
// @Tags meta
// @Success 200 {object} map[string]string
// @Router /version [get]
func versionHandler(w http.ResponseWriter, r *http.Request) {
	err := json.NewEncoder(w).Encode(map[string]string{
		"version": "0.1.0",
		"name":    "threadwell",
	})
	if err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// threadsHandler handles GET/POST threads
// @Summary List or create threads
// @Tags threads
// @Accept json
// @Produce json
// @Success 200 {array} models.Thread
// @Failure 500 {object} map[string]string
// @Router /api/threads [get]
func (h *Handler) threadsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		threads, err := h.backend.ListThreads()
		if err != nil {
			http.Error(w, `{"error":"failed to fetch threads"}`, http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(threads)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
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
		if err := h.backend.CreateThread(t); err != nil {
			http.Error(w, `{"error":"failed to save thread"}`, http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		err := json.NewEncoder(w).Encode(t)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
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
func (h *Handler) messagesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		threadID := r.URL.Query().Get("threadId")
		if threadID == "" {
			http.Error(w, `{"error":"threadId is required"}`, http.StatusBadRequest)
			return
		}
		msgs, err := h.backend.ListMessages(threadID)
		if err != nil {
			http.Error(w, `{"error":"failed to fetch messages"}`, http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(msgs)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
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
		if err := h.backend.CreateMessage(m); err != nil {
			http.Error(w, `{"error":"failed to save message"}`, http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		err := json.NewEncoder(w).Encode(m)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
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
func (h *Handler) moveHandler(w http.ResponseWriter, r *http.Request) {
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

	newThreadID, err := h.backend.MoveSubtree(id)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(map[string]string{"thread_id": newThreadID})
	if err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

type updateThreadPayload struct {
	Title string `json:"title"`
}

// threadIDHandler handles PATCH and DELETE for /api/threads/{id}
// @Summary Update or delete a thread
// @Tags threads
// @Accept json
// @Produce json
// @Param id path string true "Thread ID"
// @Success 200 {object} models.Thread
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/threads/{id} [patch]
// @Router /api/threads/{id} [delete]
func (h *Handler) threadIDHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/threads/"):]
	if id == "" {
		WriteError(w, http.StatusBadRequest, "thread ID is required")
		return
	}

	switch r.Method {
	case http.MethodPatch:
		var payload updateThreadPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			WriteError(w, http.StatusBadRequest, "invalid JSON body for patch")
			return
		}

		thread, err := h.backend.GetThread(id)
		if err != nil {
			WriteError(w, http.StatusNotFound, "thread not found")
			return
		}

		thread.Title = payload.Title

		if err := h.backend.UpdateThread(*thread); err != nil {
			WriteError(w, http.StatusInternalServerError, "failed to update thread")
			return
		}

		WriteJSON(w, http.StatusOK, thread)

	case http.MethodDelete:
		if err := h.backend.DeleteThread(id); err != nil {
			WriteError(w, http.StatusInternalServerError, "failed to delete thread")
			return
		}
		WriteJSON(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
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
func (h *Handler) messageIDHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/messages/"):]
	if id == "" {
		http.Error(w, `{"error":"id required"}`, http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		msg, err := h.backend.GetMessage(id)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
			return
		}
		if msg == nil {
			http.Error(w, `{"error":"message not found"}`, http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(msg)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}

	case http.MethodPut:
		var m models.Message
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
			return
		}
		m.ID = id
		if err := h.backend.DeleteMessage(id); err != nil {
			http.Error(w, `{"error":"could not delete old message"}`, http.StatusInternalServerError)
			return
		}
		if err := h.backend.CreateMessage(m); err != nil {
			http.Error(w, `{"error":"failed to update message"}`, http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		err := json.NewEncoder(w).Encode(m)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}

	case http.MethodDelete:
		if err := h.backend.DeleteMessage(id); err != nil {
			http.Error(w, `{"error":"failed to delete"}`, http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		err := json.NewEncoder(w).Encode(map[string]string{"deleted": id})
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// SettingsHandler handles GET, PUT for /api/settings.
// @Summary Get or Update settings
// @Accept json
// @Produce json
// @Param body body models.Settings true "Updated settings"
// @Success 200 {object} models.Settings
// @Router /api/settings [get]
// @Router /api/settings [put]
func (h *Handler) settingsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		cfg, err := h.backend.GetSettings()
		if err != nil {
			WriteError(w, http.StatusInternalServerError, "Failed to load settings")
			return
		}
		//cfg.LLMApiKey = "" // TODO: scrub sensitive field - this is annoying as if we dont leave it then user would have to re-enter
		WriteJSON(w, http.StatusOK, cfg)
		return

	case http.MethodPut:
		var cfg models.Settings
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			WriteError(w, http.StatusBadRequest, "Invalid JSON body")
			return
		}
		cfg.ID = "default" // force ID for upsert
		if err := h.backend.UpdateSettings(cfg); err != nil {
			WriteError(w, http.StatusInternalServerError, "Failed to update settings")
			return
		}
		cfg.LLMApiKey = ""
		WriteJSON(w, http.StatusOK, cfg)
		return

	default:
		WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
