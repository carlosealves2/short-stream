package oidc

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/carlosealves2/short-stream/authservice/internal/config"
	"github.com/carlosealves2/short-stream/authservice/internal/testutil/mocks"
)

func TestNewClient_WithMockServer(t *testing.T) {
	mockServer, err := mocks.NewMockOIDCServer()
	require.NoError(t, err)
	defer mockServer.Close()

	cfg := &config.OIDCConfig{
		ProviderURL:  mockServer.Issuer,
		ClientID:     mockServer.ClientID,
		ClientSecret: "test-secret",
		RedirectURL:  mockServer.RedirectURL,
		Scopes:       []string{"openid", "profile", "email"},
	}

	ctx := context.Background()
	client, err := NewClient(ctx, cfg)

	require.NoError(t, err)
	assert.NotNil(t, client)
	assert.NotNil(t, client.provider)
	assert.NotNil(t, client.oauth2Config)
	assert.NotNil(t, client.verifier)
}

func TestClient_GetAuthURL(t *testing.T) {
	mockServer, err := mocks.NewMockOIDCServer()
	require.NoError(t, err)
	defer mockServer.Close()

	cfg := &config.OIDCConfig{
		ProviderURL:  mockServer.Issuer,
		ClientID:     mockServer.ClientID,
		ClientSecret: "test-secret",
		RedirectURL:  mockServer.RedirectURL,
		Scopes:       []string{"openid", "profile"},
	}

	ctx := context.Background()
	client, err := NewClient(ctx, cfg)
	require.NoError(t, err)

	authURL := client.GetAuthURL("test-state")

	assert.NotEmpty(t, authURL)
	assert.Contains(t, authURL, mockServer.Issuer)
	assert.Contains(t, authURL, "state=test-state")
	assert.Contains(t, authURL, "client_id="+mockServer.ClientID)
}

func TestClient_ExchangeCode(t *testing.T) {
	mockServer, err := mocks.NewMockOIDCServer()
	require.NoError(t, err)
	defer mockServer.Close()

	cfg := &config.OIDCConfig{
		ProviderURL:  mockServer.Issuer,
		ClientID:     mockServer.ClientID,
		ClientSecret: "test-secret",
		RedirectURL:  mockServer.RedirectURL,
		Scopes:       []string{"openid"},
	}

	ctx := context.Background()
	client, err := NewClient(ctx, cfg)
	require.NoError(t, err)

	token, err := client.ExchangeCode(ctx, "mock-auth-code")

	require.NoError(t, err)
	assert.NotNil(t, token)
	assert.NotEmpty(t, token.AccessToken)
	assert.NotEmpty(t, token.RefreshToken)

	// Check for ID token in extras
	idToken, ok := token.Extra("id_token").(string)
	assert.True(t, ok)
	assert.NotEmpty(t, idToken)
}

func TestClient_ExchangeCode_InvalidCode(t *testing.T) {
	mockServer, err := mocks.NewMockOIDCServer()
	require.NoError(t, err)
	defer mockServer.Close()

	cfg := &config.OIDCConfig{
		ProviderURL:  mockServer.Issuer,
		ClientID:     mockServer.ClientID,
		ClientSecret: "test-secret",
		RedirectURL:  mockServer.RedirectURL,
		Scopes:       []string{"openid"},
	}

	ctx := context.Background()
	client, err := NewClient(ctx, cfg)
	require.NoError(t, err)

	_, err = client.ExchangeCode(ctx, "invalid-code")

	assert.Error(t, err)
}

func TestClient_RefreshToken(t *testing.T) {
	mockServer, err := mocks.NewMockOIDCServer()
	require.NoError(t, err)
	defer mockServer.Close()

	cfg := &config.OIDCConfig{
		ProviderURL:  mockServer.Issuer,
		ClientID:     mockServer.ClientID,
		ClientSecret: "test-secret",
		RedirectURL:  mockServer.RedirectURL,
		Scopes:       []string{"openid"},
	}

	ctx := context.Background()
	client, err := NewClient(ctx, cfg)
	require.NoError(t, err)

	// First exchange code to get initial tokens
	initialToken, err := client.ExchangeCode(ctx, "mock-auth-code")
	require.NoError(t, err)

	// Now refresh the token
	newToken, err := client.RefreshToken(ctx, initialToken.RefreshToken)

	require.NoError(t, err)
	assert.NotNil(t, newToken)
	assert.NotEmpty(t, newToken.AccessToken)
	assert.NotEmpty(t, newToken.RefreshToken)
}

func TestClient_RefreshToken_Invalid(t *testing.T) {
	mockServer, err := mocks.NewMockOIDCServer()
	require.NoError(t, err)
	defer mockServer.Close()

	cfg := &config.OIDCConfig{
		ProviderURL:  mockServer.Issuer,
		ClientID:     mockServer.ClientID,
		ClientSecret: "test-secret",
		RedirectURL:  mockServer.RedirectURL,
		Scopes:       []string{"openid"},
	}

	ctx := context.Background()
	client, err := NewClient(ctx, cfg)
	require.NoError(t, err)

	_, err = client.RefreshToken(ctx, "invalid-refresh-token")

	assert.Error(t, err)
}

func TestClient_VerifyIDToken(t *testing.T) {
	mockServer, err := mocks.NewMockOIDCServer()
	require.NoError(t, err)
	defer mockServer.Close()

	cfg := &config.OIDCConfig{
		ProviderURL:  mockServer.Issuer,
		ClientID:     mockServer.ClientID,
		ClientSecret: "test-secret",
		RedirectURL:  mockServer.RedirectURL,
		Scopes:       []string{"openid"},
	}

	ctx := context.Background()
	client, err := NewClient(ctx, cfg)
	require.NoError(t, err)

	// Exchange code to get tokens
	token, err := client.ExchangeCode(ctx, "mock-auth-code")
	require.NoError(t, err)

	rawIDToken, ok := token.Extra("id_token").(string)
	require.True(t, ok)

	// Verify the ID token
	idToken, err := client.VerifyIDToken(ctx, rawIDToken)

	require.NoError(t, err)
	assert.NotNil(t, idToken)
	assert.Equal(t, "test-user", idToken.Subject)
}

func TestMockOIDCServer_Discovery(t *testing.T) {
	mockServer, err := mocks.NewMockOIDCServer()
	require.NoError(t, err)
	defer mockServer.Close()

	// The NewClient will fetch the discovery document
	cfg := &config.OIDCConfig{
		ProviderURL:  mockServer.Issuer,
		ClientID:     mockServer.ClientID,
		ClientSecret: "test-secret",
		RedirectURL:  mockServer.RedirectURL,
		Scopes:       []string{"openid"},
	}

	ctx := context.Background()
	_, err = NewClient(ctx, cfg)

	assert.NoError(t, err)
}
