package auth

// Backend defines the interface for authentication backends.
type Backend interface {
	// Authenticate validates the provided username and password.
	// It returns true if the credentials are valid.
	Authenticate(username, password string) bool
}
