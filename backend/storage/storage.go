package storage

import "github.com/krackenservices/threadwell/models"

type Storage interface {
	Init() error

	// Threads
	ListThreads() ([]models.Thread, error)
	GetThread(id string) (*models.Thread, error)
	CreateThread(t models.Thread) error
	UpdateThread(t models.Thread) error
	DeleteThread(id string) error

	// Messages
	ListMessages(threadID string) ([]models.Message, error)
	GetMessage(id string) (*models.Message, error)
	CreateMessage(m models.Message) error
	DeleteMessage(id string) error

	// Tree operations (optional later)
	MoveSubtree(fromMessageID string) (string, error)

	// Settings
	GetSettings() (*models.Settings, error)
	UpdateSettings(models.Settings) error
}
