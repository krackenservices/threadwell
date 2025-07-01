package sqlite

import (
	"database/sql"
	"github.com/krackenservices/threadwell/models"
)

func (s *SQLiteStorage) ListUsers() ([]models.User, error) {
	rows, err := s.db.Query(`SELECT id, username, password_hash, role FROM users`)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = rows.Close()
	}()
	users := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (s *SQLiteStorage) GetUser(id string) (*models.User, error) {
	row := s.db.QueryRow(`SELECT id, username, password_hash, role FROM users WHERE id = ?`, id)
	var u models.User
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (s *SQLiteStorage) CreateUser(u models.User) error {
	_, err := s.db.Exec(`INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)`, u.ID, u.Username, u.PasswordHash, u.Role)
	return err
}

func (s *SQLiteStorage) UpdateUser(u models.User) error {
	_, err := s.db.Exec(`UPDATE users SET username = ?, password_hash = ?, role = ? WHERE id = ?`, u.Username, u.PasswordHash, u.Role, u.ID)
	return err
}

func (s *SQLiteStorage) DeleteUser(id string) error {
	_, err := s.db.Exec(`DELETE FROM users WHERE id = ?`, id)
	return err
}
