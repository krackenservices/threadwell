package file

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func writeTempCredFile(t *testing.T, creds []map[string]string) string {
	t.Helper()
	f, err := os.CreateTemp(t.TempDir(), "creds*.json")
	require.NoError(t, err)
	require.NoError(t, json.NewEncoder(f).Encode(creds))
	require.NoError(t, f.Close())
	return f.Name()
}

func TestFileBackend_Authenticate(t *testing.T) {
	pwHash, err := bcrypt.GenerateFromPassword([]byte("secret"), bcrypt.DefaultCost)
	require.NoError(t, err)

	path := writeTempCredFile(t, []map[string]string{{"username": "alice", "password": string(pwHash)}})

	fb, err := New(path)
	require.NoError(t, err)

	require.True(t, fb.Authenticate("alice", "secret"))
	require.False(t, fb.Authenticate("alice", "wrong"))
	require.False(t, fb.Authenticate("bob", "secret"))
}
