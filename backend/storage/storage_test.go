package storage_test

import (
    "os"
    "testing"
    "time"

    "github.com/google/uuid"
    "github.com/stretchr/testify/require"
    "github.com/krackenservices/threadwell/models"
    "github.com/krackenservices/threadwell/storage"
    "github.com/krackenservices/threadwell/storage/sqlite"
)

func setupTestDB(t *testing.T) storage.Storage {
    dbPath := "./testdata/test.db"
    _ = os.Remove(dbPath)

    store, err := sqlite.New(dbPath)
    require.NoError(t, err)
    return store
}

func TestStorage_CRUD(t *testing.T) {
    s := setupTestDB(t)

    // Create thread
    thread := models.Thread{
        ID:        uuid.NewString(),
        Title:     "Test Thread",
        CreatedAt: time.Now().Unix(),
    }

    err := s.CreateThread(thread)
    require.NoError(t, err)

    // Get thread
    loadedThread, err := s.GetThread(thread.ID)
    require.NoError(t, err)
    require.Equal(t, thread.ID, loadedThread.ID)

    // List threads
    threads, err := s.ListThreads()
    require.NoError(t, err)
    require.Len(t, threads, 1)

    // Create message
    msg := models.Message{
        ID:        uuid.NewString(),
        ThreadID:  thread.ID,
        ParentID:  nil,
        Role:      "user",
        Content:   "Hello!",
        Timestamp: time.Now().Unix(),
    }

    err = s.CreateMessage(msg)
    require.NoError(t, err)

    // List messages
    msgs, err := s.ListMessages(thread.ID)
    require.NoError(t, err)
    require.Len(t, msgs, 1)

    // Get message
    loadedMsg, err := s.GetMessage(msg.ID)
    require.NoError(t, err)
    require.Equal(t, msg.Content, loadedMsg.Content)

    // Delete message
    err = s.DeleteMessage(msg.ID)
    require.NoError(t, err)

    msgs, _ = s.ListMessages(thread.ID)
    require.Len(t, msgs, 0)

    // Delete thread
    err = s.DeleteThread(thread.ID)
    require.NoError(t, err)

    threads, _ = s.ListThreads()
    require.Len(t, threads, 0)
}
