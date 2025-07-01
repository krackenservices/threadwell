package file

import (
	"encoding/json"
	"errors"
	"os"

	"golang.org/x/crypto/bcrypt"

	"github.com/krackenservices/threadwell/auth"
)

type user struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// FileBackend implements auth.Backend by loading user credentials from a JSON file.
type FileBackend struct {
	users map[string]string // username -> password hash
}

// New creates a FileBackend using the provided file path.
// The JSON file should contain an array of objects with "username" and "password" fields.
func New(path string) (auth.Backend, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var data []user
	if err := json.NewDecoder(f).Decode(&data); err != nil {
		return nil, err
	}

	fb := &FileBackend{users: make(map[string]string)}
	for _, u := range data {
		fb.users[u.Username] = u.Password
	}
	return fb, nil
}

// NewFromEnv loads the credential file specified by the AUTH_FILE environment variable.
func NewFromEnv() (auth.Backend, error) {
	path := os.Getenv("AUTH_FILE")
	if path == "" {
		return nil, errors.New("AUTH_FILE not set")
	}
	return New(path)
}

// Authenticate checks the provided username and password against the loaded credentials.
func (fb *FileBackend) Authenticate(username, password string) bool {
	hash, ok := fb.users[username]
	if !ok {
		return false
	}
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
