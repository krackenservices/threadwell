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

func TestMessagePUTAndDELETE(t *testing.T) {
	srv := newTestServer()
	defer srv.Close()

	// Step 1: Create thread
	thread := models.Thread{Title: "update-delete-thread"}
	buf := new(bytes.Buffer)
	json.NewEncoder(buf).Encode(thread)
	res, _ := http.Post(srv.URL+"/api/threads", "application/json", buf)

	var createdThread models.Thread
	json.NewDecoder(res.Body).Decode(&createdThread)

	// Step 2: Create message
	msg := models.Message{
		ThreadID:  createdThread.ID,
		Role:      "user",
		Content:   "original",
		Timestamp: 1,
	}
	buf.Reset()
	json.NewEncoder(buf).Encode(msg)
	res, _ = http.Post(srv.URL+"/api/messages", "application/json", buf)

	var createdMsg models.Message
	json.NewDecoder(res.Body).Decode(&createdMsg)

	// Step 3: Update message with PUT
	updated := createdMsg
	updated.Content = "updated content"
	buf.Reset()
	json.NewEncoder(buf).Encode(updated)

	req, _ := http.NewRequest(http.MethodPut, srv.URL+"/api/messages/"+createdMsg.ID, buf)
	req.Header.Set("Content-Type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil || res.StatusCode != 200 {
		t.Fatalf("PUT failed, got %d", res.StatusCode)
	}

	// Step 4: GET message to verify update
	res, _ = http.Get(srv.URL + "/api/messages/" + createdMsg.ID)
	var got models.Message
	json.NewDecoder(res.Body).Decode(&got)
	if got.Content != "updated content" {
		t.Errorf("Expected updated content, got %s", got.Content)
	}

	// Step 5: DELETE message
	req, _ = http.NewRequest(http.MethodDelete, srv.URL+"/api/messages/"+createdMsg.ID, nil)
	res, err = http.DefaultClient.Do(req)
	if err != nil || res.StatusCode != 200 {
		t.Fatalf("DELETE failed, got %d", res.StatusCode)
	}
}

func TestMoveSubtree(t *testing.T) {
	srv := newTestServer()
	defer srv.Close()

	// Create thread
	thread := models.Thread{Title: "fork-test"}
	buf := new(bytes.Buffer)
	json.NewEncoder(buf).Encode(thread)
	res, _ := http.Post(srv.URL+"/api/threads", "application/json", buf)
	var createdThread models.Thread
	json.NewDecoder(res.Body).Decode(&createdThread)

	// Create root message
	root := models.Message{
		ThreadID:  createdThread.ID,
		Role:      "user",
		Content:   "root",
		Timestamp: 1,
	}
	buf.Reset()
	json.NewEncoder(buf).Encode(root)
	res, _ = http.Post(srv.URL+"/api/messages", "application/json", buf)
	var rootMsg models.Message
	json.NewDecoder(res.Body).Decode(&rootMsg)

	// Create child
	child := models.Message{
		ThreadID:  createdThread.ID,
		ParentID:  &rootMsg.ID,
		RootID:    &rootMsg.ID,
		Role:      "assistant",
		Content:   "child",
		Timestamp: 2,
	}
	buf.Reset()
	json.NewEncoder(buf).Encode(child)
	res, _ = http.Post(srv.URL+"/api/messages", "application/json", buf)
	var childMsg models.Message
	json.NewDecoder(res.Body).Decode(&childMsg)

	// POST /api/move/{id}
	moveURL := srv.URL + "/api/move/" + childMsg.ID
	res, err := http.Post(moveURL, "application/json", nil)
	if err != nil {
		t.Fatalf("move request failed: %v", err)
	}
	if res.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}
	var result map[string]string
	json.NewDecoder(res.Body).Decode(&result)
	if result["thread_id"] == "" {
		t.Errorf("expected thread_id in response")
	}
}
