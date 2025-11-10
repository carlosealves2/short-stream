package oidc

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
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

func TestClient_GetEndSessionURL(t *testing.T) {
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

	// Exchange code to get tokens with ID token
	token, err := client.ExchangeCode(ctx, "mock-auth-code")
	require.NoError(t, err)

	rawIDToken, ok := token.Extra("id_token").(string)
	require.True(t, ok)
	require.NotEmpty(t, rawIDToken)

	postLogoutRedirectURI := "http://localhost:3000/logout"

	// Test GetEndSessionURL
	logoutURL := client.GetEndSessionURL(rawIDToken, postLogoutRedirectURI)

	assert.NotEmpty(t, logoutURL)
	assert.Contains(t, logoutURL, mockServer.Issuer+"/logout")
	assert.Contains(t, logoutURL, "id_token_hint="+rawIDToken)
	assert.Contains(t, logoutURL, "post_logout_redirect_uri="+postLogoutRedirectURI)
}

func TestClient_GetEndSessionURL_WithEmptyIDToken(t *testing.T) {
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

	postLogoutRedirectURI := "http://localhost:3000/logout"

	// Test GetEndSessionURL with empty ID token
	logoutURL := client.GetEndSessionURL("", postLogoutRedirectURI)

	assert.NotEmpty(t, logoutURL)
	assert.Contains(t, logoutURL, mockServer.Issuer+"/logout")
	assert.Contains(t, logoutURL, "post_logout_redirect_uri="+postLogoutRedirectURI)
}

func TestClient_GetEndSessionURL_WithEmptyPostLogoutRedirectURI(t *testing.T) {
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

	// Exchange code to get tokens with ID token
	token, err := client.ExchangeCode(ctx, "mock-auth-code")
	require.NoError(t, err)

	rawIDToken, ok := token.Extra("id_token").(string)
	require.True(t, ok)

	// Test GetEndSessionURL with empty post logout redirect URI
	logoutURL := client.GetEndSessionURL(rawIDToken, "")

	assert.NotEmpty(t, logoutURL)
	assert.Contains(t, logoutURL, mockServer.Issuer+"/logout")
	assert.Contains(t, logoutURL, "id_token_hint="+rawIDToken)
}

func TestClient_VerifyIDToken_Invalid(t *testing.T) {
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

	// Try to verify an invalid ID token
	_, err = client.VerifyIDToken(ctx, "invalid-id-token")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to verify ID token")
}

func TestNewClient_InvalidProvider(t *testing.T) {
	cfg := &config.OIDCConfig{
		ProviderURL:  "http://invalid-provider-url-that-does-not-exist",
		ClientID:     "test-client",
		ClientSecret: "test-secret",
		RedirectURL:  "http://localhost:8080/callback",
		Scopes:       []string{"openid"},
	}

	ctx := context.Background()
	_, err := NewClient(ctx, cfg)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to create OIDC provider")
}

func TestClient_ExchangeCode_MissingIDToken(t *testing.T) {
	// Create a custom mock server that returns tokens without ID token
	customServer := createMockServerWithoutIDToken(t)
	defer customServer.Close()

	cfg := &config.OIDCConfig{
		ProviderURL:  customServer.URL,
		ClientID:     "test-client",
		ClientSecret: "test-secret",
		RedirectURL:  "http://localhost:8080/callback",
		Scopes:       []string{"openid"},
	}

	ctx := context.Background()
	client, err := NewClient(ctx, cfg)
	require.NoError(t, err)

	_, err = client.ExchangeCode(ctx, "test-code")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no id_token in token response")
}

func TestClient_GetEndSessionURL_NoEndpoint(t *testing.T) {
	// Create a mock server without end_session_endpoint
	customServer := createMockServerWithoutEndSession(t)
	defer customServer.Close()

	cfg := &config.OIDCConfig{
		ProviderURL:  customServer.URL,
		ClientID:     "test-client",
		ClientSecret: "test-secret",
		RedirectURL:  "http://localhost:8080/callback",
		Scopes:       []string{"openid"},
	}

	ctx := context.Background()
	client, err := NewClient(ctx, cfg)
	require.NoError(t, err)

	// Should return empty string when no end_session_endpoint
	logoutURL := client.GetEndSessionURL("test-id-token", "http://localhost:3000")

	assert.Empty(t, logoutURL)
}

// Helper function to create a mock OIDC server without end_session_endpoint
func createMockServerWithoutEndSession(_ *testing.T) *httptest.Server {
	mux := http.NewServeMux()

	// Discovery endpoint WITHOUT end_session_endpoint
	mux.HandleFunc("/.well-known/openid-configuration", func(w http.ResponseWriter, r *http.Request) {
		serverURL := "http://" + r.Host
		discovery := map[string]interface{}{
			"issuer":                 serverURL,
			"authorization_endpoint": serverURL + "/authorize",
			"token_endpoint":         serverURL + "/token",
			"jwks_uri":              serverURL + "/jwks",
			// NO end_session_endpoint
			"response_types_supported": []string{"code"},
			"subject_types_supported":  []string{"public"},
			"id_token_signing_alg_values_supported": []string{"RS256"},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(discovery)
	})

	// JWKS endpoint
	mux.HandleFunc("/jwks", func(w http.ResponseWriter, _ *http.Request) {
		jwks := map[string]interface{}{
			"keys": []map[string]interface{}{
				{
					"kty": "RSA",
					"alg": "RS256",
					"use": "sig",
					"kid": "test-key-id",
					"n":   "test-n",
					"e":   "AQAB",
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(jwks)
	})

	return httptest.NewServer(mux)
}

// Helper function to create a mock OIDC server without ID token
func createMockServerWithoutIDToken(_ *testing.T) *httptest.Server {
	mux := http.NewServeMux()

	// Discovery endpoint
	mux.HandleFunc("/.well-known/openid-configuration", func(w http.ResponseWriter, r *http.Request) {
		serverURL := "http://" + r.Host
		discovery := map[string]interface{}{
			"issuer":                 serverURL,
			"authorization_endpoint": serverURL + "/authorize",
			"token_endpoint":         serverURL + "/token",
			"jwks_uri":              serverURL + "/jwks",
			"response_types_supported": []string{"code"},
			"subject_types_supported":  []string{"public"},
			"id_token_signing_alg_values_supported": []string{"RS256"},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(discovery)
	})

	// JWKS endpoint
	mux.HandleFunc("/jwks", func(w http.ResponseWriter, _ *http.Request) {
		jwks := map[string]interface{}{
			"keys": []map[string]interface{}{
				{
					"kty": "RSA",
					"alg": "RS256",
					"use": "sig",
					"kid": "test-key-id",
					"n":   "test-n",
					"e":   "AQAB",
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(jwks)
	})

	// Token endpoint that returns token WITHOUT id_token
	mux.HandleFunc("/token", func(w http.ResponseWriter, _ *http.Request) {
		response := map[string]interface{}{
			"access_token":  "test-access-token",
			"token_type":    "Bearer",
			"expires_in":    3600,
			"refresh_token": "test-refresh-token",
			// NO id_token field
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
	})

	return httptest.NewServer(mux)
}
