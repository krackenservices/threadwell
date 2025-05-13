package testhelpers

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"github.com/krackenservices/threadwell/models"
	"github.com/krackenservices/threadwell/storage"
)

func RunStorageSuite(t *testing.T, name string, store storage.Storage) {
	t.Run(name+"/CRUD", func(t *testing.T) {
		require.NoError(t, store.Init())

		thread := models.Thread{
			ID:        uuid.NewString(),
			Title:     "Test Thread",
			CreatedAt: time.Now().Unix(),
		}
		require.NoError(t, store.CreateThread(thread))

		t1, err := store.GetThread(thread.ID)
		require.NoError(t, err)
		require.Equal(t, thread.ID, t1.ID)

		threads, err := store.ListThreads()
		require.NoError(t, err)
		require.NotEmpty(t, threads)

		msg := models.Message{
			ID:        uuid.NewString(),
			ThreadID:  thread.ID,
			Role:      "user",
			Content:   "hello",
			Timestamp: time.Now().Unix(),
		}
		require.NoError(t, store.CreateMessage(msg))

		msgs, err := store.ListMessages(thread.ID)
		require.NoError(t, err)
		require.Len(t, msgs, 1)

		gotMsg, err := store.GetMessage(msg.ID)
		require.NoError(t, err)
		require.Equal(t, msg.Content, gotMsg.Content)

		require.NoError(t, store.DeleteMessage(msg.ID))
		msgs, _ = store.ListMessages(thread.ID)
		require.Len(t, msgs, 0)

		require.NoError(t, store.DeleteThread(thread.ID))
		threads, _ = store.ListThreads()
		require.Len(t, threads, 0)
	})
}
