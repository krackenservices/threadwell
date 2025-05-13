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
	settings *models.Settings
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

	// 🧠 Step 1: Walk UP the ancestry chain
	ancestry := []models.Message{}
	cur := &orig
	for cur != nil && cur.ParentID != nil {
		parent, ok := m.messages[*cur.ParentID]
		if !ok {
			break
		}
		ancestry = append([]models.Message{parent}, ancestry...) // prepend
		cur = &parent
	}

	// 🧠 Step 2: BFS to collect descendants
	descendants := map[string]models.Message{orig.ID: orig}
	queue := []string{orig.ID}
	for len(queue) > 0 {
		pid := queue[0]
		queue = queue[1:]
		for _, msg := range m.messages {
			if msg.ParentID != nil && *msg.ParentID == pid {
				descendants[msg.ID] = msg
				queue = append(queue, msg.ID)
			}
		}
	}

	// 🧠 Step 3: Combine all messages to move
	toMove := map[string]models.Message{}
	for _, a := range ancestry {
		toMove[a.ID] = a
	}
	for id, d := range descendants {
		toMove[id] = d
	}

	// 🧠 Step 4: Generate ID remap
	idMap := map[string]string{}
	for oldID := range toMove {
		idMap[oldID] = uuid.NewString()
	}
	rootOld := ancestry[0].ID
	rootNew := idMap[rootOld]

	// 🧠 Step 5: Create new thread
	newThreadID := uuid.NewString()
	title := "Branched"
	if orig.Content != "" {
		preview := orig.Content
		if len(preview) > 20 {
			preview = preview[:20]
		}
		title = "Branched: " + preview
	}
	m.threads[newThreadID] = models.Thread{
		ID:        newThreadID,
		Title:     title,
		CreatedAt: time.Now().Unix(),
	}

	// 🧠 Step 6: Copy messages
	// 🧠 Step 6: Copy messages
	for _, old := range toMove {
		newID := idMap[old.ID]
		var newParent *string
		if old.ParentID != nil {
			if remap, ok := idMap[*old.ParentID]; ok {
				newParent = &remap
			}
		}

		// Insert new message into new thread
		m.messages[newID] = models.Message{
			ID:        newID,
			ThreadID:  newThreadID,
			ParentID:  newParent,
			RootID:    &rootNew,
			Role:      old.Role,
			Content:   old.Content,
			Timestamp: old.Timestamp,
		}

		// ❌ Delete only if this message is part of the branch (from `fromID` down)
		if _, ok := descendants[old.ID]; ok {
			delete(m.messages, old.ID)
		}
	}
	return newThreadID, nil
}

func (s *MemoryStorage) GetSettings() (*models.Settings, error) {
	if s.settings == nil {
		s.settings = &models.Settings{
			ID:           "default",
			LLMProvider:  "ollama",
			LLMEndpoint:  "http://localhost:11434",
			LLMName:      "llama3",
			SimulateOnly: true,
		}
	}
	return s.settings, nil
}

func (s *MemoryStorage) UpdateSettings(cfg models.Settings) error {
	s.settings = &cfg
	return nil
}
