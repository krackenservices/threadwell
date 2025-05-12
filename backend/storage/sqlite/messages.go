package sqlite

import (
	"database/sql"

	"github.com/krackenservices/threadwell/models"
)

func (s *SQLiteStorage) ListMessages(threadID string) ([]models.Message, error) {
	rows, err := s.db.Query(`SELECT id, thread_id, parent_id, role, content, timestamp FROM messages WHERE thread_id = ? ORDER BY timestamp`, threadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var m models.Message
		var parentID sql.NullString
		if err := rows.Scan(&m.ID, &m.ThreadID, &parentID, &m.Role, &m.Content, &m.Timestamp); err != nil {
			return nil, err
		}
		if parentID.Valid {
			m.ParentID = &parentID.String
		}
		messages = append(messages, m)
	}
	return messages, nil
}

func (s *SQLiteStorage) GetMessage(id string) (*models.Message, error) {
	row := s.db.QueryRow(`SELECT id, thread_id, parent_id, role, content, timestamp FROM messages WHERE id = ?`, id)
	var m models.Message
	var parentID sql.NullString
	if err := row.Scan(&m.ID, &m.ThreadID, &parentID, &m.Role, &m.Content, &m.Timestamp); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	if parentID.Valid {
		m.ParentID = &parentID.String
	}
	return &m, nil
}

func (s *SQLiteStorage) CreateMessage(m models.Message) error {
	_, err := s.db.Exec(
		`INSERT INTO messages (id, thread_id, parent_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
		m.ID, m.ThreadID, m.ParentID, m.Role, m.Content, m.Timestamp,
	)
	return err
}

func (s *SQLiteStorage) DeleteMessage(id string) error {
	_, err := s.db.Exec(`DELETE FROM messages WHERE id = ?`, id)
	return err
}
