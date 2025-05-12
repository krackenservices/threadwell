package sqlite

import (
	"database/sql"

	"github.com/krackenservices/threadwell/models"
)

func (s *SQLiteStorage) ListThreads() ([]models.Thread, error) {
	rows, err := s.db.Query(`SELECT id, title, created_at FROM threads`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var threads []models.Thread
	for rows.Next() {
		var t models.Thread
		if err := rows.Scan(&t.ID, &t.Title, &t.CreatedAt); err != nil {
			return nil, err
		}
		threads = append(threads, t)
	}
	return threads, nil
}

func (s *SQLiteStorage) GetThread(id string) (*models.Thread, error) {
	row := s.db.QueryRow(`SELECT id, title, created_at FROM threads WHERE id = ?`, id)
	var t models.Thread
	if err := row.Scan(&t.ID, &t.Title, &t.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &t, nil
}

func (s *SQLiteStorage) CreateThread(t models.Thread) error {
	_, err := s.db.Exec(`INSERT INTO threads (id, title, created_at) VALUES (?, ?, ?)`,
		t.ID, t.Title, t.CreatedAt)
	return err
}

func (s *SQLiteStorage) DeleteThread(id string) error {
	_, err := s.db.Exec(`DELETE FROM threads WHERE id = ?`, id)
	return err
}
