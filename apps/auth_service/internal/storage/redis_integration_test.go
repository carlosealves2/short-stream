package storage

import (
	"context"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	testredis "github.com/testcontainers/testcontainers-go/modules/redis"
)

func setupRedisContainer(t *testing.T) (*testredis.RedisContainer, redis.UniversalClient) {
	ctx := context.Background()

	redisContainer, err := testredis.Run(ctx,
		"docker.io/redis:7-alpine",
		testredis.WithSnapshotting(10, 1),
		testredis.WithLogLevel(testredis.LogLevelVerbose),
	)
	require.NoError(t, err)

	t.Cleanup(func() {
		if err := redisContainer.Terminate(ctx); err != nil {
			t.Fatalf("failed to terminate container: %s", err)
		}
	})

	connectionString, err := redisContainer.ConnectionString(ctx)
	require.NoError(t, err)

	opts, err := redis.ParseURL(connectionString)
	require.NoError(t, err)

	client := redis.NewClient(opts)

	return redisContainer, client
}

func TestRedisStore_CreateState(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()

	state, err := store.CreateState(ctx)

	require.NoError(t, err)
	assert.NotEmpty(t, state)

	// Verify state exists in Redis
	val, err := client.Get(ctx, "state:"+state).Result()
	assert.NoError(t, err)
	assert.Equal(t, "valid", val)

	// Verify state has TTL
	ttl, err := client.TTL(ctx, "state:"+state).Result()
	assert.NoError(t, err)
	assert.Greater(t, ttl, time.Duration(0))
	assert.LessOrEqual(t, ttl, 10*time.Minute)
}

func TestRedisStore_ValidateState_Valid(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()

	// Create a state first
	state, err := store.CreateState(ctx)
	require.NoError(t, err)

	// Validate the state
	err = store.ValidateState(ctx, state)

	assert.NoError(t, err)

	// Verify state is deleted after validation
	_, err = client.Get(ctx, "state:"+state).Result()
	assert.Equal(t, redis.Nil, err)
}

func TestRedisStore_ValidateState_Invalid(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()

	// Try to validate non-existent state
	err := store.ValidateState(ctx, "invalid-state")

	assert.Error(t, err)
}

func TestRedisStore_CreateSession(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()
	refreshToken := "test-refresh-token"

	sessionID, err := store.CreateSession(ctx, refreshToken)

	require.NoError(t, err)
	assert.NotEmpty(t, sessionID)

	// Verify session exists in Redis
	val, err := client.Get(ctx, "session:"+sessionID).Result()
	assert.NoError(t, err)
	assert.Equal(t, refreshToken, val)

	// Verify session has TTL
	ttl, err := client.TTL(ctx, "session:"+sessionID).Result()
	assert.NoError(t, err)
	assert.Greater(t, ttl, time.Duration(0))
	assert.LessOrEqual(t, ttl, 3600*time.Second)
}

func TestRedisStore_GetRefreshToken_Valid(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()
	refreshToken := "test-refresh-token"

	// Create session first
	sessionID, err := store.CreateSession(ctx, refreshToken)
	require.NoError(t, err)

	// Get refresh token
	retrievedToken, err := store.GetRefreshToken(ctx, sessionID)

	require.NoError(t, err)
	assert.Equal(t, refreshToken, retrievedToken)
}

func TestRedisStore_GetRefreshToken_Invalid(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()

	// Try to get non-existent session
	_, err := store.GetRefreshToken(ctx, "invalid-session-id")

	assert.Error(t, err)
}

func TestRedisStore_UpdateSession(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()
	oldRefreshToken := "old-refresh-token"
	newRefreshToken := "new-refresh-token"

	// Create session first
	sessionID, err := store.CreateSession(ctx, oldRefreshToken)
	require.NoError(t, err)

	// Update session
	err = store.UpdateSession(ctx, sessionID, newRefreshToken)

	require.NoError(t, err)

	// Verify token was updated
	val, err := client.Get(ctx, "session:"+sessionID).Result()
	assert.NoError(t, err)
	assert.Equal(t, newRefreshToken, val)
}

func TestRedisStore_UpdateSession_NonExistent(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()

	// Try to update non-existent session
	err := store.UpdateSession(ctx, "invalid-session-id", "new-token")

	assert.Error(t, err)
}

func TestRedisStore_DeleteSession(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()
	refreshToken := "test-refresh-token"

	// Create session first
	sessionID, err := store.CreateSession(ctx, refreshToken)
	require.NoError(t, err)

	// Delete session
	err = store.DeleteSession(ctx, sessionID)

	require.NoError(t, err)

	// Verify session is deleted
	_, err = client.Get(ctx, "session:"+sessionID).Result()
	assert.Equal(t, redis.Nil, err)
}

func TestRedisStore_DeleteSession_NonExistent(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()

	// Delete non-existent session should not error
	err := store.DeleteSession(ctx, "invalid-session-id")

	assert.NoError(t, err)
}

func TestRedisStore_StateExpiration(t *testing.T) {
	_, client := setupRedisContainer(t)
	// Create store with very short session TTL for testing
	store := NewRedisStore(client, 1)

	ctx := context.Background()

	// Create a state to test natural expiration
	state, err := store.CreateState(ctx)
	require.NoError(t, err)

	// Manually set a short TTL for testing
	err = client.Expire(ctx, "state:"+state, 1*time.Second).Err()
	require.NoError(t, err)

	// Wait for expiration
	time.Sleep(2 * time.Second)

	// State should be expired
	err = store.ValidateState(ctx, state)
	assert.Error(t, err)
}

func TestRedisStore_SessionExpiration(t *testing.T) {
	_, client := setupRedisContainer(t)
	// Create store with very short session TTL for testing
	store := NewRedisStore(client, 1)

	ctx := context.Background()
	refreshToken := "test-refresh-token"

	// Create session
	sessionID, err := store.CreateSession(ctx, refreshToken)
	require.NoError(t, err)

	// Session should exist immediately
	_, err = store.GetRefreshToken(ctx, sessionID)
	assert.NoError(t, err)

	// Wait for expiration
	time.Sleep(2 * time.Second)

	// Session should be expired
	_, err = store.GetRefreshToken(ctx, sessionID)
	assert.Error(t, err)
}

func TestRedisStore_ConcurrentOperations(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()

	// Create multiple states concurrently
	done := make(chan bool)
	states := make([]string, 10)

	for i := 0; i < 10; i++ {
		go func(index int) {
			state, err := store.CreateState(ctx)
			require.NoError(t, err)
			states[index] = state
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}

	// Verify all states are unique
	uniqueStates := make(map[string]bool)
	for _, state := range states {
		assert.NotEmpty(t, state)
		uniqueStates[state] = true
	}
	assert.Len(t, uniqueStates, 10)
}

func TestRedisStore_Integration_FullFlow(t *testing.T) {
	_, client := setupRedisContainer(t)
	store := NewRedisStore(client, 3600)

	ctx := context.Background()

	// Simulate full authentication flow
	// 1. Create state for OAuth
	state, err := store.CreateState(ctx)
	require.NoError(t, err)
	assert.NotEmpty(t, state)

	// 2. Validate state (simulating callback)
	err = store.ValidateState(ctx, state)
	require.NoError(t, err)

	// 3. Create session with refresh token
	refreshToken := "initial-refresh-token"
	sessionID, err := store.CreateSession(ctx, refreshToken)
	require.NoError(t, err)
	assert.NotEmpty(t, sessionID)

	// 4. Get refresh token (simulating token refresh)
	retrievedToken, err := store.GetRefreshToken(ctx, sessionID)
	require.NoError(t, err)
	assert.Equal(t, refreshToken, retrievedToken)

	// 5. Update session with new refresh token
	newRefreshToken := "new-refresh-token"
	err = store.UpdateSession(ctx, sessionID, newRefreshToken)
	require.NoError(t, err)

	// 6. Verify token was updated
	updatedToken, err := store.GetRefreshToken(ctx, sessionID)
	require.NoError(t, err)
	assert.Equal(t, newRefreshToken, updatedToken)

	// 7. Delete session (simulating logout)
	err = store.DeleteSession(ctx, sessionID)
	require.NoError(t, err)

	// 8. Verify session is gone
	_, err = store.GetRefreshToken(ctx, sessionID)
	assert.Error(t, err)
}
