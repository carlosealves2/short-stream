package mocks

import (
	"context"

	"github.com/stretchr/testify/mock"
)

// MockStore is a mock implementation of Store interface
type MockStore struct {
	mock.Mock
}

// CreateState mocks the CreateState method
func (m *MockStore) CreateState(ctx context.Context) (string, error) {
	args := m.Called(ctx)
	return args.String(0), args.Error(1)
}

// ValidateState mocks the ValidateState method
func (m *MockStore) ValidateState(ctx context.Context, state string) error {
	args := m.Called(ctx, state)
	return args.Error(0)
}

// CreateSession mocks the CreateSession method
func (m *MockStore) CreateSession(ctx context.Context, refreshToken string) (string, error) {
	args := m.Called(ctx, refreshToken)
	return args.String(0), args.Error(1)
}

// GetRefreshToken mocks the GetRefreshToken method
func (m *MockStore) GetRefreshToken(ctx context.Context, sessionID string) (string, error) {
	args := m.Called(ctx, sessionID)
	return args.String(0), args.Error(1)
}

// UpdateSession mocks the UpdateSession method
func (m *MockStore) UpdateSession(ctx context.Context, sessionID, refreshToken string) error {
	args := m.Called(ctx, sessionID, refreshToken)
	return args.Error(0)
}

// DeleteSession mocks the DeleteSession method
func (m *MockStore) DeleteSession(ctx context.Context, sessionID string) error {
	args := m.Called(ctx, sessionID)
	return args.Error(0)
}
