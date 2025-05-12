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
	_ = os.MkdirAll("./testdata", 0755)
	_ = os.Remove(dbPath)

	store, err := sqlite.New(dbPath)
	require.NoError(t, err)
	return store
}

func cleanupTest(t *testing.T) {
	dbPath := "./testdata/test.db"
	_ = os.MkdirAll("./testdata", 0755)
	_ = os.Remove(dbPath)
	_= os.Remove("./testdata/")
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

func TestStorage_MoveSubtree(t *testing.T) {
	s := setupTestDB(t)

	root := models.Message{
		ID:        uuid.NewString(),
		ThreadID:  "thread1",
		ParentID:  nil,
		RootID:    nil,
		Role:      "user",
		Content:   "root",
		Timestamp: time.Now().Unix(),
	}
	require.NoError(t, s.CreateThread(models.Thread{
		ID:        "thread1",
		Title:     "Original",
		CreatedAt: time.Now().Unix(),
	}))
	require.NoError(t, s.CreateMessage(root))

	child1 := models.Message{
		ID:        uuid.NewString(),
		ThreadID:  "thread1",
		ParentID:  &root.ID,
		RootID:    &root.ID,
		Role:      "assistant",
		Content:   "child 1",
		Timestamp: time.Now().Unix(),
	}
	child2 := models.Message{
		ID:        uuid.NewString(),
		ThreadID:  "thread1",
		ParentID:  &child1.ID,
		RootID:    &root.ID,
		Role:      "user",
		Content:   "child 2",
		Timestamp: time.Now().Unix(),
	}

	require.NoError(t, s.CreateMessage(child1))
	require.NoError(t, s.CreateMessage(child2))

	// Perform move
	newThreadID, err := s.MoveSubtree(child1.ID)
	require.NoError(t, err)
	require.NotEmpty(t, newThreadID)

	msgs, err := s.ListMessages(newThreadID)
	require.NoError(t, err)
	require.Len(t, msgs, 2)

	var movedChild1, movedChild2 *models.Message
	for _, m := range msgs {
		switch m.Content {
		case "child 1":
			movedChild1 = &m
		case "child 2":
			movedChild2 = &m
		}
	}

	require.NotNil(t, movedChild1)
	require.NotNil(t, movedChild2)
	require.Equal(t, movedChild1.ID, *movedChild2.ParentID)

	// root_id should be the same on both
	require.NotNil(t, movedChild1.RootID)
	require.NotNil(t, movedChild2.RootID)
	require.Equal(t, *movedChild1.RootID, *movedChild2.RootID)
	require.Equal(t, *movedChild1.RootID, movedChild1.ID)

	cleanupTest(t)
}
