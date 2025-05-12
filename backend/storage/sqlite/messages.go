package sqlite

import (
	"database/sql"
	"fmt"
	"github.com/google/uuid"
	"github.com/krackenservices/threadwell/models"
	"time"
)

func (s *SQLiteStorage) MoveSubtree(fromID string) (string, error) {
	// Step 1: Load the original message
	origMsg, err := s.GetMessage(fromID)
	if err != nil {
		return "", fmt.Errorf("failed to find root message: %w", err)
	}
	if origMsg == nil {
		return "", fmt.Errorf("message not found")
	}

	// Step 2: Create new thread
	newThreadID := uuid.NewString()
	newThread := models.Thread{
		ID:        newThreadID,
		Title:     "Branched from " + fromID[:6],
		CreatedAt: time.Now().Unix(),
	}
	if err := s.CreateThread(newThread); err != nil {
		return "", fmt.Errorf("failed to create new thread: %w", err)
	}

	// Step 3: Find all descendants (BFS)
	messagesToMove := map[string]*models.Message{
		origMsg.ID: origMsg,
	}

	queue := []string{origMsg.ID}
	for len(queue) > 0 {
		parentID := queue[0]
		queue = queue[1:]

		rows, err := s.db.Query(`
            SELECT id, thread_id, parent_id, role, content, timestamp 
            FROM messages WHERE parent_id = ?`, parentID)
		if err != nil {
			return "", fmt.Errorf("query descendants: %w", err)
		}

		for rows.Next() {
			var m models.Message
			var parentID sql.NullString
			if err := rows.Scan(&m.ID, &m.ThreadID, &parentID, &m.Role, &m.Content, &m.Timestamp); err != nil {
				return "", err
			}
			if parentID.Valid {
				m.ParentID = &parentID.String
			}

			messagesToMove[m.ID] = &m
			queue = append(queue, m.ID)
		}
		rows.Close()
	}

	// Step 4: Remap IDs and relationships
	idMap := map[string]string{}
	for oldID := range messagesToMove {
		idMap[oldID] = uuid.NewString()
	}

	rootNewID := idMap[fromID]

	tx, err := s.db.Begin()
	if err != nil {
		return "", err
	}

	// Insert messages into new thread
	stmt, err := tx.Prepare(`
        INSERT INTO messages (id, thread_id, parent_id, root_id, role, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		return "", err
	}
	defer stmt.Close()

	for _, m := range messagesToMove {
		newID := idMap[m.ID]
		var newParentID *string
		if m.ParentID != nil {
			p := idMap[*m.ParentID]
			newParentID = &p
		}

		_, err := stmt.Exec(
			newID,
			newThreadID,
			newParentID,
			rootNewID,
			m.Role,
			m.Content,
			m.Timestamp,
		)
		if err != nil {
			tx.Rollback()
			return "", err
		}

		// Optionally delete the original
		_, err = tx.Exec(`DELETE FROM messages WHERE id = ?`, m.ID)
		if err != nil {
			tx.Rollback()
			return "", err
		}
	}

	err = tx.Commit()
	if err != nil {
		return "", err
	}

	return newThreadID, nil
}

func (s *SQLiteStorage) ListMessages(threadID string) ([]models.Message, error) {
	rows, err := s.db.Query(`SELECT id, thread_id, parent_id, root_id, role, content, timestamp FROM messages WHERE thread_id = ? ORDER BY timestamp`, threadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var m models.Message
		var parentID, rootID sql.NullString

		if err := rows.Scan(&m.ID, &m.ThreadID, &parentID, &rootID, &m.Role, &m.Content, &m.Timestamp); err != nil {
			return nil, err
		}
		if parentID.Valid {
			m.ParentID = &parentID.String
		}
		if rootID.Valid {
			m.RootID = &rootID.String
		}
		messages = append(messages, m)
	}
	return messages, nil
}

func (s *SQLiteStorage) GetMessage(id string) (*models.Message, error) {
	row := s.db.QueryRow(`SELECT id, thread_id, parent_id, root_id, role, content, timestamp FROM messages WHERE id = ?`, id)
	var m models.Message
	var parentID, rootID sql.NullString

	if err := row.Scan(&m.ID, &m.ThreadID, &parentID, &rootID, &m.Role, &m.Content, &m.Timestamp); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	if parentID.Valid {
		m.ParentID = &parentID.String
	}
	if rootID.Valid {
		m.RootID = &rootID.String
	}
	return &m, nil
}

func (s *SQLiteStorage) CreateMessage(m models.Message) error {
	_, err := s.db.Exec(
		`INSERT INTO messages (id, thread_id, parent_id, root_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		m.ID, m.ThreadID, m.ParentID, m.RootID, m.Role, m.Content, m.Timestamp,
	)
	return err
}

func (s *SQLiteStorage) DeleteMessage(id string) error {
	_, err := s.db.Exec(`DELETE FROM messages WHERE id = ?`, id)
	return err
}
