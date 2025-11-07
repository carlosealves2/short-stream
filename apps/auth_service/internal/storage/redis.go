// Package storage provides storage implementations for the auth service
package storage

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	sessionPrefix = "session:"
	statePrefix   = "state:"
	stateTTL      = 10 * time.Minute
)

type redisStore struct {
	client     redis.UniversalClient
	sessionTTL time.Duration
}

// NewRedisStore creates a new Redis-backed storage implementation
func NewRedisStore(client redis.UniversalClient, sessionMaxAge int) Store {
	return &redisStore{
		client:     client,
		sessionTTL: time.Duration(sessionMaxAge) * time.Second,
	}
}

func (r *redisStore) CreateState(ctx context.Context) (string, error) {
	state := uuid.New().String()
	key := statePrefix + state

	if err := r.client.Set(ctx, key, "valid", stateTTL).Err(); err != nil {
		return "", fmt.Errorf("failed to create state: %w", err)
	}

	return state, nil
}

func (r *redisStore) ValidateState(ctx context.Context, state string) error {
	key := statePrefix + state

	exists, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		return fmt.Errorf("failed to validate state: %w", err)
	}

	if exists == 0 {
		return fmt.Errorf("invalid or expired state")
	}

	if err := r.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete state: %w", err)
	}

	return nil
}

func (r *redisStore) CreateSession(ctx context.Context, refreshToken string) (string, error) {
	sessionID := uuid.New().String()
	key := sessionPrefix + sessionID

	if err := r.client.Set(ctx, key, refreshToken, r.sessionTTL).Err(); err != nil {
		return "", fmt.Errorf("failed to create session: %w", err)
	}

	return sessionID, nil
}

func (r *redisStore) GetRefreshToken(ctx context.Context, sessionID string) (string, error) {
	key := sessionPrefix + sessionID

	refreshToken, err := r.client.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return "", fmt.Errorf("session not found or expired")
	}
	if err != nil {
		return "", fmt.Errorf("failed to get session: %w", err)
	}

	return refreshToken, nil
}

func (r *redisStore) UpdateSession(ctx context.Context, sessionID, refreshToken string) error {
	key := sessionPrefix + sessionID

	exists, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		return fmt.Errorf("failed to check session: %w", err)
	}

	if exists == 0 {
		return fmt.Errorf("session not found")
	}

	if err := r.client.Set(ctx, key, refreshToken, r.sessionTTL).Err(); err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}

	return nil
}

func (r *redisStore) DeleteSession(ctx context.Context, sessionID string) error {
	key := sessionPrefix + sessionID

	if err := r.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	return nil
}
