package memory

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/krackenservices/threadwell/models"
	"github.com/krackenservices/threadwell/storage"
)

type MemoryStorage struct {
	mu       sync.RWMutex
	threads  map[string]models.Thread
	messages map[string]models.Message
}

func New() storage.Storage {
	return &MemoryStorage{
		threads:  make(map[string]models.Thread),
		messages: make(map[string]models.Message),
	}
}

func (m *MemoryStorage) Init() error {
	return nil
}

func (m *MemoryStorage) ListThreads() ([]models.Thread, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]models.Thread, 0, len(m.threads))
	for _, t := range m.threads {
		out = append(out, t)
	}
	return out, nil
}

func (m *MemoryStorage) GetThread(id string) (*models.Thread, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	t, ok := m.threads[id]
	if !ok {
		return nil, nil
	}
	return &t, nil
}

func (m *MemoryStorage) CreateThread(t models.Thread) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.threads[t.ID] = t
	return nil
}

func (m *MemoryStorage) DeleteThread(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.threads, id)
	for mid, msg := range m.messages {
		if msg.ThreadID == id {
			delete(m.messages, mid)
		}
	}
	return nil
}

func (m *MemoryStorage) ListMessages(threadID string) ([]models.Message, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []models.Message
	for _, msg := range m.messages {
		if msg.ThreadID == threadID {
			out = append(out, msg)
		}
	}
	return out, nil
}

func (m *MemoryStorage) GetMessage(id string) (*models.Message, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	msg, ok := m.messages[id]
	if !ok {
		return nil, nil
	}
	return &msg, nil
}

func (m *MemoryStorage) CreateMessage(msg models.Message) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.messages[msg.ID] = msg
	return nil
}

func (m *MemoryStorage) DeleteMessage(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.messages, id)
	return nil
}

func (m *MemoryStorage) MoveSubtree(fromMessageID string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	orig, ok := m.messages[fromMessageID]
	if !ok {
		return "", errors.New("message not found")
	}

	newThreadID := uuid.NewString()
	m.threads[newThreadID] = models.Thread{
		ID:        newThreadID,
		Title:     "Branched",
		CreatedAt: time.Now().Unix(),
	}

	// BFS
	toMove := map[string]models.Message{orig.ID: orig}
	queue := []string{orig.ID}
	for len(queue) > 0 {
		pid := queue[0]
		queue = queue[1:]
		for _, msg := range m.messages {
			if msg.ParentID != nil && *msg.ParentID == pid {
				toMove[msg.ID] = msg
				queue = append(queue, msg.ID)
			}
		}
	}

	idMap := map[string]string{}
	for oldID := range toMove {
		idMap[oldID] = uuid.NewString()
	}
	rootID := idMap[orig.ID]

	newMsgs := map[string]models.Message{}
	for _, old := range toMove {
		newID := idMap[old.ID]
		var newParent *string
		if old.ParentID != nil {
			p := idMap[*old.ParentID]
			newParent = &p
		}

		newMsgs[newID] = models.Message{
			ID:        newID,
			ThreadID:  newThreadID,
			ParentID:  newParent,
			RootID:    &rootID,
			Role:      old.Role,
			Content:   old.Content,
			Timestamp: old.Timestamp,
		}

		delete(m.messages, old.ID)
	}

	for id, msg := range newMsgs {
		m.messages[id] = msg
	}

	return newThreadID, nil
}
