package sqlite

import (
    "database/sql"
    _ "github.com/mattn/go-sqlite3"

    "github.com/krackenservices/threadwell/models"
    "github.com/krackenservices/threadwell/storage"
)

type SQLiteStorage struct {
    db *sql.DB
}

func New(path string) (storage.Storage, error) {
    db, err := sql.Open("sqlite3", path)
    if err != nil {
        return nil, err
    }
    s := &SQLiteStorage{db: db}
    return s, s.Init()
}

func (s *SQLiteStorage) Init() error {
    _, err := s.db.Exec(`
    CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        thread_id TEXT,
        parent_id TEXT,
        role TEXT,
        content TEXT,
        timestamp INTEGER,
        FOREIGN KEY(thread_id) REFERENCES threads(id),
        FOREIGN KEY(parent_id) REFERENCES messages(id)
    );`)
    return err
}
