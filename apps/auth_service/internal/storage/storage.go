package storage

import "context"

// Store defines the interface for session and state storage
type Store interface {
	// State management
	CreateState(ctx context.Context) (string, error)
	ValidateState(ctx context.Context, state string) error

	// Session management
	CreateSession(ctx context.Context, refreshToken string) (string, error)
	GetRefreshToken(ctx context.Context, sessionID string) (string, error)
	UpdateSession(ctx context.Context, sessionID, refreshToken string) error
	DeleteSession(ctx context.Context, sessionID string) error
}
