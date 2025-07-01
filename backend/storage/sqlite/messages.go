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

	// Step 2: Walk up to root — build ancestor chain
	ancestry := []*models.Message{}
	current := origMsg
	for current != nil && current.ParentID != nil {
		parent, err := s.GetMessage(*current.ParentID)
		if err != nil {
			break
		}
		ancestry = append([]*models.Message{parent}, ancestry...) // prepend
		current = parent
	}

	// Step 3: BFS to collect descendants
	descendants := map[string]*models.Message{}
	queue := []string{fromID}
	for len(queue) > 0 {
		parentID := queue[0]
		queue = queue[1:]

		rows, err := s.db.Query(`
            SELECT id, thread_id, parent_id, root_id, role, content, timestamp
            FROM messages WHERE parent_id = ?`, parentID)
		if err != nil {
			return "", fmt.Errorf("query descendants: %w", err)
		}

		for rows.Next() {
			var m models.Message
			var parentID sql.NullString
			if err := rows.Scan(&m.ID, &m.ThreadID, &parentID, &m.RootID, &m.Role, &m.Content, &m.Timestamp); err != nil {
				closeErr := rows.Close()
				if closeErr != nil {
					return "", fmt.Errorf("scan error: %w; additionally failed to close rows: %v", err, closeErr)
				}
				return "", err
			}
			if parentID.Valid {
				m.ParentID = &parentID.String
			}
			descendants[m.ID] = &m
			queue = append(queue, m.ID)
		}
		err = rows.Close()
		if err != nil {
			return "", err
		}
	}

	// Step 4: Collect all to move
	messagesToMove := map[string]*models.Message{}
	for _, m := range ancestry {
		messagesToMove[m.ID] = m
	}
	messagesToMove[origMsg.ID] = origMsg
	for id, m := range descendants {
		messagesToMove[id] = m
	}

	// Step 5: Remap IDs
	idMap := map[string]string{}
	for oldID := range messagesToMove {
		idMap[oldID] = uuid.NewString()
	}
	rootNewID := idMap[fromID]
	if len(ancestry) > 0 {
		rootNewID = idMap[ancestry[0].ID]
	}

	// Step 6: Begin transaction and create new thread
	tx, err := s.db.Begin()
	if err != nil {
		return "", err
	}

	title := "Branched"
	if origMsg.Content != "" {
		preview := origMsg.Content
		if len(preview) > 20 {
			preview = preview[:20]
		}
		title = fmt.Sprintf("Branched: %s", preview)
	}
	newThreadID := uuid.NewString()
	newThread := models.Thread{
		ID:        newThreadID,
		Title:     title,
		CreatedAt: time.Now().Unix(),
	}
	if _, err := tx.Exec(`INSERT INTO threads (id, title, created_at) VALUES (?, ?, ?)`,
		newThread.ID, newThread.Title, newThread.CreatedAt); err != nil {
		rollbackerr := tx.Rollback()
		if rollbackerr != nil {
			return "", fmt.Errorf("failed to create thread: %w; additionally failed to rollback transaction: %v", err, rollbackerr)
		}
		return "", fmt.Errorf("failed to create thread: %w", err)
	}

	// Step 7: Insert copied messages

	stmt, err := tx.Prepare(`
        INSERT INTO messages (id, thread_id, parent_id, root_id, role, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		rollbackerr := tx.Rollback()
		if rollbackerr != nil {
			return "", fmt.Errorf("prepare error: %w; additionally failed to rollback transaction: %v", err, rollbackerr)
		}
		return "", err
	}
	defer func() {
		if closeErr := stmt.Close(); closeErr != nil {
			// Log or propagate only if not already returning an error
			if err == nil {
				err = fmt.Errorf("stmt.Close failed: %w", closeErr)
			} else {
				// Optionally wrap both errors
				err = fmt.Errorf("%w; stmt.Close also failed: %v", err, closeErr)
			}
		}
	}()

	for _, m := range messagesToMove {
		newID := idMap[m.ID]
		var newParentID *string
		if m.ParentID != nil {
			if remapped, ok := idMap[*m.ParentID]; ok {
				newParentID = &remapped
			}
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
			rollbackerr := tx.Rollback()
			if rollbackerr != nil {
				return "", fmt.Errorf("insert failed for %s → %s: %w; additionally failed to rollback transaction: %v", m.ID, newID, err, rollbackerr)
			}
			return "", fmt.Errorf("insert failed for %s → %s: %w", m.ID, newID, err)
		}
	}

	// Step 7b: Delete original branch messages (from fromID down)
	for id := range descendants {
		_, err := tx.Exec(`DELETE FROM messages WHERE id = ?`, id)
		if err != nil {
			rollbackerr := tx.Rollback()
			if rollbackerr != nil {
				return "", fmt.Errorf("failed to delete descendant %s: %w; additionally failed to rollback transaction: %v", id, err, rollbackerr)
			}
			return "", fmt.Errorf("failed to delete descendant %s: %w", id, err)
		}
	}

	// Also delete the original "from" message itself
	_, err = tx.Exec(`DELETE FROM messages WHERE id = ?`, fromID)
	if err != nil {
		rollbackerr := tx.Rollback()
		if rollbackerr != nil {
			return "", fmt.Errorf("failed to delete original message %s: %w; additionally failed to rollback transaction: %v", fromID, err, rollbackerr)
		}
		return "", fmt.Errorf("failed to delete original message %s: %w", fromID, err)
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
	defer func() {
		closeErr := rows.Close()
		if err == nil {
			err = closeErr
		}
	}()

	messages := make([]models.Message, 0)
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
