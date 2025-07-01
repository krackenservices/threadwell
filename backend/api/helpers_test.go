package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestWriteJSONAndError(t *testing.T) {
	rr := httptest.NewRecorder()
	WriteJSON(rr, http.StatusCreated, map[string]string{"ok": "true"})

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d", http.StatusCreated, rr.Code)
	}
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %s", ct)
	}
	expected := "{\"ok\":\"true\"}\n"
	if rr.Body.String() != expected {
		t.Fatalf("unexpected body: %s", rr.Body.String())
	}

	rr = httptest.NewRecorder()
	WriteError(rr, http.StatusBadRequest, "bad")
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "bad") {
		t.Fatalf("expected error message in body")
	}
}
