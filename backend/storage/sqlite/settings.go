package sqlite

import (
	"database/sql"
	"github.com/krackenservices/threadwell/models"
)

func (s *SQLiteStorage) ensureSettingsTable() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS settings (
			id TEXT PRIMARY KEY,
			llm_provider TEXT,
			llm_endpoint TEXT,
			llm_api_key TEXT,
			simulate_only BOOLEAN
		)
	`)
	return err
}

func (s *SQLiteStorage) GetSettings() (*models.Settings, error) {
	err := s.ensureSettingsTable()
	if err != nil {
		return nil, err
	}

	row := s.db.QueryRow(`SELECT id, llm_provider, llm_endpoint, llm_api_key, simulate_only FROM settings WHERE id = "default"`)

	var cfg models.Settings
	err = row.Scan(&cfg.ID, &cfg.LLMProvider, &cfg.LLMEndpoint, &cfg.LLMApiKey, &cfg.SimulateOnly)
	if err == sql.ErrNoRows {
		// Insert default
		cfg = models.Settings{
			ID:           "default",
			LLMProvider:  "ollama",
			LLMEndpoint:  "http://localhost:11434",
			SimulateOnly: true,
		}
		_ = s.UpdateSettings(cfg)
		return &cfg, nil
	} else if err != nil {
		return nil, err
	}

	return &cfg, nil
}

func (s *SQLiteStorage) UpdateSettings(cfg models.Settings) error {
	err := s.ensureSettingsTable()
	if err != nil {
		return err
	}

	_, err = s.db.Exec(`
		INSERT INTO settings (id, llm_provider, llm_endpoint, llm_api_key, simulate_only)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			llm_provider=excluded.llm_provider,
			llm_endpoint=excluded.llm_endpoint,
			llm_api_key=excluded.llm_api_key,
			simulate_only=excluded.simulate_only
	`, cfg.ID, cfg.LLMProvider, cfg.LLMEndpoint, cfg.LLMApiKey, cfg.SimulateOnly)

	return err
}
