package api_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/krackenservices/threadwell/api"
	"github.com/krackenservices/threadwell/models"
	"github.com/krackenservices/threadwell/storage/memory"
)

func newTestServer() *httptest.Server {
	mux := http.NewServeMux()
	store := memory.New()
	api.RegisterRoutes(mux, store)
	return httptest.NewServer(mux)
}

func TestThreadCRUD(t *testing.T) {
	srv := newTestServer()
	defer srv.Close()

	// Create thread
	body := `{"title":"test thread"}`
	res, err := http.Post(srv.URL+"/api/threads", "application/json", bytes.NewBufferString(body))
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201, got %d", res.StatusCode)
	}

	var created models.Thread
	json.NewDecoder(res.Body).Decode(&created)

	// List threads
	res, err = http.Get(srv.URL + "/api/threads")
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}
}

func TestMessageCRUD(t *testing.T) {
	srv := newTestServer()
	defer srv.Close()

	// Create thread
	thread := models.Thread{Title: "msg-thread"}
	buf := new(bytes.Buffer)
	json.NewEncoder(buf).Encode(thread)
	res, err := http.Post(srv.URL+"/api/threads", "application/json", buf)
	if err != nil {
		t.Fatal(err)
	}
	var createdThread models.Thread
	json.NewDecoder(res.Body).Decode(&createdThread)

	// Create message
	msg := models.Message{
		ThreadID:  createdThread.ID,
		Role:      "user",
		Content:   "hello",
		Timestamp: 12345678,
	}
	buf.Reset()
	json.NewEncoder(buf).Encode(msg)
	res, err = http.Post(srv.URL+"/api/messages", "application/json", buf)
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201, got %d", res.StatusCode)
	}

	// Get messages
	res, err = http.Get(srv.URL + "/api/messages?threadId=" + createdThread.ID)
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}
}
