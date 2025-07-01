package config

import (
	"os"
	"testing"
)

func TestLoadReadsEnv(t *testing.T) {
	os.Setenv("STORAGE_TYPE", "sqlite")
	os.Setenv("STORAGE_PATH", "/tmp/test.db")
	defer os.Unsetenv("STORAGE_TYPE")
	defer os.Unsetenv("STORAGE_PATH")

	cfg := Load()
	if cfg.Storage.Type != "sqlite" {
		t.Fatalf("expected storage type sqlite, got %s", cfg.Storage.Type)
	}
	if cfg.Storage.Path != "/tmp/test.db" {
		t.Fatalf("expected storage path /tmp/test.db, got %s", cfg.Storage.Path)
	}
}
