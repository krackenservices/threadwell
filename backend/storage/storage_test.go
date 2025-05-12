package storage_test

import (
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/krackenservices/threadwell/models"
	"github.com/krackenservices/threadwell/storage"
	"github.com/krackenservices/threadwell/storage/memory"
	"github.com/krackenservices/threadwell/storage/sqlite"
	"github.com/stretchr/testify/require"
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
	_ = os.Remove("./testdata/")
}

func TestMemoryStorage(t *testing.T) {
	store := memory.New()
	require.NoError(t, store.Init())
	runStorageTests(t, "memory", store)
}

func TestMemoryStorage_MoveSubtree(t *testing.T) {
	store := memory.New()
	require.NoError(t, store.Init())
	runMoveSubtreeTest(t, store)
}

func TestStorage_CRUD(t *testing.T) {
	s := setupTestDB(t)
	runStorageTests(t, "sqlite", s)
}

func TestStorage_MoveSubtree(t *testing.T) {
	s := setupTestDB(t)
	runMoveSubtreeTest(t, s)
	cleanupTest(t)
}

func runStorageTests(t *testing.T, label string, store storage.Storage) {
	t.Run(label+"/CRUD", func(t *testing.T) {
		thread := models.Thread{
			ID:        uuid.NewString(),
			Title:     "Test Thread",
			CreatedAt: time.Now().Unix(),
		}

		err := store.CreateThread(thread)
		require.NoError(t, err)

		loadedThread, err := store.GetThread(thread.ID)
		require.NoError(t, err)
		require.Equal(t, thread.ID, loadedThread.ID)

		threads, err := store.ListThreads()
		require.NoError(t, err)
		require.Len(t, threads, 1)

		msg := models.Message{
			ID:        uuid.NewString(),
			ThreadID:  thread.ID,
			ParentID:  nil,
			RootID:    nil,
			Role:      "user",
			Content:   "Hello!",
			Timestamp: time.Now().Unix(),
		}

		err = store.CreateMessage(msg)
		require.NoError(t, err)

		msgs, err := store.ListMessages(thread.ID)
		require.NoError(t, err)
		require.Len(t, msgs, 1)

		loadedMsg, err := store.GetMessage(msg.ID)
		require.NoError(t, err)
		require.Equal(t, msg.Content, loadedMsg.Content)

		err = store.DeleteMessage(msg.ID)
		require.NoError(t, err)

		msgs, _ = store.ListMessages(thread.ID)
		require.Len(t, msgs, 0)

		err = store.DeleteThread(thread.ID)
		require.NoError(t, err)

		threads, _ = store.ListThreads()
		require.Len(t, threads, 0)
	})
}

func runMoveSubtreeTest(t *testing.T, s storage.Storage) {
	require.NoError(t, s.CreateThread(models.Thread{
		ID:        "thread1",
		Title:     "Original",
		CreatedAt: time.Now().Unix(),
	}))

	root := models.Message{
		ID:        uuid.NewString(),
		ThreadID:  "thread1",
		ParentID:  nil,
		RootID:    nil,
		Role:      "user",
		Content:   "root",
		Timestamp: time.Now().Unix(),
	}
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

	require.NotNil(t, movedChild1.RootID)
	require.NotNil(t, movedChild2.RootID)
	require.Equal(t, *movedChild1.RootID, *movedChild2.RootID)
	require.Equal(t, *movedChild1.RootID, movedChild1.ID)
}
