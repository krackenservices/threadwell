package testhelpers

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"github.com/krackenservices/threadwell/models"
	"github.com/krackenservices/threadwell/storage"
)

func RunMoveSubtreeSuite(t *testing.T, name string, store storage.Storage) {
	t.Run(name+"/MoveSubtree_SimpleChain", func(t *testing.T) {
		require.NoError(t, store.Init())

		// Thread: M1 → M2 → M3
		thread := models.Thread{ID: uuid.NewString(), Title: "Orig", CreatedAt: time.Now().Unix()}
		require.NoError(t, store.CreateThread(thread))

		m1 := models.Message{
			ID:        "m1",
			ThreadID:  thread.ID,
			Role:      "user",
			Content:   "M1",
			Timestamp: time.Now().Unix(),
		}
		m2 := models.Message{
			ID:        "m2",
			ThreadID:  thread.ID,
			ParentID:  &m1.ID,
			RootID:    &m1.ID,
			Role:      "user",
			Content:   "M2",
			Timestamp: time.Now().Unix(),
		}
		m3 := models.Message{
			ID:        "m3",
			ThreadID:  thread.ID,
			ParentID:  &m2.ID,
			RootID:    &m1.ID,
			Role:      "user",
			Content:   "M3",
			Timestamp: time.Now().Unix(),
		}

		require.NoError(t, store.CreateMessage(m1))
		require.NoError(t, store.CreateMessage(m2))
		require.NoError(t, store.CreateMessage(m3))

		// Branch from M3
		newThreadID, err := store.MoveSubtree("m3")
		require.NoError(t, err)

		// Original thread should contain M1 + M2
		msgsOrig, err := store.ListMessages(thread.ID)
		require.NoError(t, err)
		require.Len(t, msgsOrig, 2)

		// New thread should contain copied M1 + M2, and M3
		msgsNew, err := store.ListMessages(newThreadID)
		require.NoError(t, err)
		require.Len(t, msgsNew, 3)

		contents := map[string]bool{}
		for _, m := range msgsNew {
			contents[m.Content] = true
		}
		require.True(t, contents["M1"])
		require.True(t, contents["M2"])
		require.True(t, contents["M3"])
	})

	t.Run(name+"/MoveSubtree_MidChain", func(t *testing.T) {
		require.NoError(t, store.Init())

		// Thread: M1 → M2 → M3 → M4
		thread := models.Thread{ID: uuid.NewString(), Title: "Deep", CreatedAt: time.Now().Unix()}
		require.NoError(t, store.CreateThread(thread))

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

		msgsOrig, err := store.ListMessages(thread.ID)
		require.NoError(t, err)
		require.Len(t, msgsOrig, 1)
		require.Equal(t, "M1", msgsOrig[0].Content)

		msgsNew, err := store.ListMessages(newThreadID)
		require.NoError(t, err)
		require.Len(t, msgsNew, 4)

		found := map[string]bool{}
		for _, m := range msgsNew {
			found[m.Content] = true
		}
		require.True(t, found["M1"])
		require.True(t, found["M2"])
		require.True(t, found["M3"])
		require.True(t, found["M4"])
	})
}
