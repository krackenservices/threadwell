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
	require.Len(t, msgs, 3) // ✅ Expect 3 messages: root (copied), child 1, child 2

	found := map[string]*models.Message{}
	for _, m := range msgs {
		found[m.Content] = &m
	}

	require.Contains(t, found, "root")
	require.Contains(t, found, "child 1")
	require.Contains(t, found, "child 2")

	require.NotNil(t, found["child 1"].ParentID)
	require.Equal(t, *found["child 1"].ParentID, found["root"].ID)
	require.Equal(t, *found["child 2"].ParentID, found["child 1"].ID)

	require.NotNil(t, found["child 1"].RootID)
	require.NotNil(t, found["child 2"].RootID)
	require.Equal(t, *found["child 1"].RootID, *found["child 2"].RootID)
	require.Equal(t, *found["child 1"].RootID, found["root"].ID)
}

func TestStorage_MoveSubtree_CopiesAncestorsAndMovesBranch(t *testing.T) {
	store := setupTestDB(t)
	defer cleanupTest(t)

	// Create thread and messages: M1 → M2 → M3
	thread := models.Thread{ID: uuid.NewString(), Title: "T", CreatedAt: time.Now().Unix()}
	require.NoError(t, store.CreateThread(thread))

	m1 := models.Message{
		ID:        "m1",
		ThreadID:  thread.ID,
		Role:      "user",
		Content:   "M1",
		Timestamp: time.Now().Unix(),
	}
	require.NoError(t, store.CreateMessage(m1))

	m2 := models.Message{
		ID:        "m2",
		ThreadID:  thread.ID,
		ParentID:  &m1.ID,
		RootID:    &m1.ID,
		Role:      "user",
		Content:   "M2",
		Timestamp: time.Now().Unix(),
	}
	require.NoError(t, store.CreateMessage(m2))

	m3 := models.Message{
		ID:        "m3",
		ThreadID:  thread.ID,
		ParentID:  &m2.ID,
		RootID:    &m1.ID,
		Role:      "user",
		Content:   "M3",
		Timestamp: time.Now().Unix(),
	}
	require.NoError(t, store.CreateMessage(m3))

	// Perform branch from M3
	newThreadID, err := store.MoveSubtree("m3")
	require.NoError(t, err)
	require.NotEqual(t, thread.ID, newThreadID)

	// Check original thread only has M1 and M2
	msgsOrig, err := store.ListMessages(thread.ID)
	require.NoError(t, err)
	require.Len(t, msgsOrig, 2)
	msgIDsOrig := map[string]bool{}
	for _, m := range msgsOrig {
		msgIDsOrig[m.ID] = true
	}
	require.Contains(t, msgIDsOrig, "m1")
	require.Contains(t, msgIDsOrig, "m2")
	require.NotContains(t, msgIDsOrig, "m3")

	// Check new thread has M1, M2 (copied) and M3 (moved)
	msgsNew, err := store.ListMessages(newThreadID)
	require.NoError(t, err)
	require.Len(t, msgsNew, 3)

	// Track ID mapping and structure
	var copiedM3 *models.Message
	for _, m := range msgsNew {
		if m.Content == "M3" {
			copiedM3 = &m
		}
	}

	require.NotNil(t, copiedM3, "M3 was not copied into new thread")
	require.NotEqual(t, copiedM3.ID, "m3")
	require.NotEqual(t, copiedM3.ThreadID, thread.ID)
	require.NotNil(t, copiedM3.ParentID)
	require.NotNil(t, copiedM3.RootID)
}

func TestStorage_MoveSubtree_FromMiddleOfDeepTree(t *testing.T) {
	store := setupTestDB(t)
	defer cleanupTest(t)

	thread := models.Thread{ID: uuid.NewString(), Title: "DeepTree", CreatedAt: time.Now().Unix()}
	require.NoError(t, store.CreateThread(thread))

	// Chain: M1 → M2 → M3 → M4
	m1 := models.Message{ID: "m1", ThreadID: thread.ID, Role: "user", Content: "M1", Timestamp: time.Now().Unix()}
	m2 := models.Message{ID: "m2", ThreadID: thread.ID, ParentID: &m1.ID, RootID: &m1.ID, Role: "user", Content: "M2", Timestamp: time.Now().Unix()}
	m3 := models.Message{ID: "m3", ThreadID: thread.ID, ParentID: &m2.ID, RootID: &m1.ID, Role: "assistant", Content: "M3", Timestamp: time.Now().Unix()}
	m4 := models.Message{ID: "m4", ThreadID: thread.ID, ParentID: &m3.ID, RootID: &m1.ID, Role: "user", Content: "M4", Timestamp: time.Now().Unix()}

	require.NoError(t, store.CreateMessage(m1))
	require.NoError(t, store.CreateMessage(m2))
	require.NoError(t, store.CreateMessage(m3))
	require.NoError(t, store.CreateMessage(m4))

	// Branch from M2
	newThreadID, err := store.MoveSubtree("m2")
	require.NoError(t, err)

	// Check original thread only contains M1
	origMsgs, err := store.ListMessages(thread.ID)
	require.NoError(t, err)
	require.Len(t, origMsgs, 1)
	require.Equal(t, "M1", origMsgs[0].Content)

	// Check new thread contains M2–M4 + copied M1
	newMsgs, err := store.ListMessages(newThreadID)
	require.NoError(t, err)
	require.Len(t, newMsgs, 4)

	var foundM1, foundM4 *models.Message
	for _, m := range newMsgs {
		if m.Content == "M1" {
			foundM1 = &m
		}
		if m.Content == "M4" {
			foundM4 = &m
		}
	}

	require.NotNil(t, foundM1)
	require.NotNil(t, foundM4)
	require.Equal(t, "user", foundM4.Role)
}
