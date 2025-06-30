package api_test

import (
	"bytes"
	"encoding/json"
	"github.com/stretchr/testify/require"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/krackenservices/threadwell/api"
	"github.com/krackenservices/threadwell/models"
	"github.com/krackenservices/threadwell/storage/memory"
)

func newTestServer() *httptest.Server {
	store := memory.New()
	handler := api.RegisterRoutes(store)
	return httptest.NewServer(handler)
}

func TestEmptyCollectionsReturnEmptyArray(t *testing.T) {
	srv := newTestServer()
	defer srv.Close()

	t.Run("GET /api/threads with no threads returns empty array", func(t *testing.T) {
		res, err := http.Get(srv.URL + "/api/threads")
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, res.StatusCode, "Expected status OK")

		body, err := io.ReadAll(res.Body)
		closeErr := res.Body.Close()
		require.NoError(t, err)
		require.NoError(t, closeErr)

		// Assert that the body is an empty JSON array `[]` and not `null`
		require.Equal(t, "[]", strings.TrimSpace(string(body)))
	})

	t.Run("GET /api/messages for a new thread returns empty array", func(t *testing.T) {
		// First, create a new thread so we have a valid ID
		threadBody := `{"title":"empty thread"}`
		res, err := http.Post(srv.URL+"/api/threads", "application/json", bytes.NewBufferString(threadBody))
		require.NoError(t, err)
		var createdThread models.Thread
		err = json.NewDecoder(res.Body).Decode(&createdThread)
		closeErr := res.Body.Close()
		require.NoError(t, err)
		require.NoError(t, closeErr)

		// Now, get messages for the new, empty thread
		res, err = http.Get(srv.URL + "/api/messages?threadId=" + createdThread.ID)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, res.StatusCode, "Expected status OK")

		resBody, err := io.ReadAll(res.Body)
		closeErr = res.Body.Close()
		require.NoError(t, err)
		require.NoError(t, closeErr)

		// Assert that the body is an empty JSON array `[]`
		require.Equal(t, "[]", strings.TrimSpace(string(resBody)))
	})
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
	err = json.NewDecoder(res.Body).Decode(&created)
	require.NoError(t, err)

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
	err := json.NewEncoder(buf).Encode(thread)
	require.NoError(t, err)
	res, err := http.Post(srv.URL+"/api/threads", "application/json", buf)
	if err != nil {
		t.Fatal(err)
	}
	var createdThread models.Thread
	err = json.NewDecoder(res.Body).Decode(&createdThread)
	require.NoError(t, err)

	// Create message
	msg := models.Message{
		ThreadID:  createdThread.ID,
		Role:      "user",
		Content:   "hello",
		Timestamp: 12345678,
	}
	buf.Reset()
	err = json.NewEncoder(buf).Encode(msg)
	require.NoError(t, err)
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
	err := json.NewEncoder(buf).Encode(thread)
	require.NoError(t, err)
	res, _ := http.Post(srv.URL+"/api/threads", "application/json", buf)

	var createdThread models.Thread
	err = json.NewDecoder(res.Body).Decode(&createdThread)
	require.NoError(t, err)

	// Step 2: Create message
	msg := models.Message{
		ThreadID:  createdThread.ID,
		Role:      "user",
		Content:   "original",
		Timestamp: 1,
	}
	buf.Reset()
	err = json.NewEncoder(buf).Encode(msg)
	require.NoError(t, err)
	res, _ = http.Post(srv.URL+"/api/messages", "application/json", buf)

	var createdMsg models.Message
	err = json.NewDecoder(res.Body).Decode(&createdMsg)
	require.NoError(t, err)

	// Step 3: Update message with PUT
	updated := createdMsg
	updated.Content = "updated content"
	buf.Reset()
	err = json.NewEncoder(buf).Encode(updated)
	require.NoError(t, err)

	req, _ := http.NewRequest(http.MethodPut, srv.URL+"/api/messages/"+createdMsg.ID, buf)
	req.Header.Set("Content-Type", "application/json")
	res, err = http.DefaultClient.Do(req)
	if err != nil || res.StatusCode != 200 {
		t.Fatalf("PUT failed, got %d", res.StatusCode)
	}

	// Step 4: GET message to verify update
	res, _ = http.Get(srv.URL + "/api/messages/" + createdMsg.ID)
	var got models.Message
	err = json.NewDecoder(res.Body).Decode(&got)
	require.NoError(t, err)
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
	err := json.NewEncoder(buf).Encode(thread)
	require.NoError(t, err)
	res, _ := http.Post(srv.URL+"/api/threads", "application/json", buf)
	var createdThread models.Thread
	err = json.NewDecoder(res.Body).Decode(&createdThread)
	require.NoError(t, err)

	// Create root message
	root := models.Message{
		ThreadID:  createdThread.ID,
		Role:      "user",
		Content:   "root",
		Timestamp: 1,
	}
	buf.Reset()
	err = json.NewEncoder(buf).Encode(root)
	require.NoError(t, err)

	res, _ = http.Post(srv.URL+"/api/messages", "application/json", buf)
	var rootMsg models.Message
	err = json.NewDecoder(res.Body).Decode(&rootMsg)
	require.NoError(t, err)

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
	err = json.NewEncoder(buf).Encode(child)
	require.NoError(t, err)

	res, _ = http.Post(srv.URL+"/api/messages", "application/json", buf)
	var childMsg models.Message
	err = json.NewDecoder(res.Body).Decode(&childMsg)
	require.NoError(t, err)

	// POST /api/move/{id}
	moveURL := srv.URL + "/api/move/" + childMsg.ID
	res, err = http.Post(moveURL, "application/json", nil)
	if err != nil {
		t.Fatalf("move request failed: %v", err)
	}
	if res.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}
	var result map[string]string
	err = json.NewDecoder(res.Body).Decode(&result)
	require.NoError(t, err)

	if result["thread_id"] == "" {
		t.Errorf("expected thread_id in response")
	}
}
