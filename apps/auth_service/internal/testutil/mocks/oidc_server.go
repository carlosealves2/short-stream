// Package mocks provides mock implementations for testing
package mocks

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"net/http/httptest"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// MockOIDCServer is a mock OIDC provider for testing
type MockOIDCServer struct {
	Server      *httptest.Server
	PrivateKey  *rsa.PrivateKey
	ClientID    string
	RedirectURL string
	Issuer      string
}

// NewMockOIDCServer creates a new mock OIDC server
func NewMockOIDCServer() (*MockOIDCServer, error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, err
	}

	mock := &MockOIDCServer{
		PrivateKey:  privateKey,
		ClientID:    "test-client-id",
		RedirectURL: "http://localhost:8080/auth/callback",
	}

	mux := http.NewServeMux()

	// Discovery endpoint
	mux.HandleFunc("/.well-known/openid-configuration", mock.handleDiscovery)

	// JWKS endpoint
	mux.HandleFunc("/jwks", mock.handleJWKS)

	// Authorization endpoint
	mux.HandleFunc("/authorize", mock.handleAuthorize)

	// Token endpoint
	mux.HandleFunc("/token", mock.handleToken)

	mock.Server = httptest.NewServer(mux)
	mock.Issuer = mock.Server.URL

	return mock, nil
}

// Close closes the mock server
func (m *MockOIDCServer) Close() {
	m.Server.Close()
}

// handleDiscovery returns the OIDC discovery document
func (m *MockOIDCServer) handleDiscovery(w http.ResponseWriter, _ *http.Request) {
	discovery := map[string]interface{}{
		"issuer":                 m.Issuer,
		"authorization_endpoint": m.Issuer + "/authorize",
		"token_endpoint":         m.Issuer + "/token",
		"jwks_uri":              m.Issuer + "/jwks",
		"response_types_supported": []string{"code"},
		"subject_types_supported":  []string{"public"},
		"id_token_signing_alg_values_supported": []string{"RS256"},
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(discovery)
}

// handleJWKS returns the JSON Web Key Set
func (m *MockOIDCServer) handleJWKS(w http.ResponseWriter, _ *http.Request) {
	publicKey := &m.PrivateKey.PublicKey

	// Convert public key exponent and modulus to base64url
	n := base64.RawURLEncoding.EncodeToString(publicKey.N.Bytes())
	e := base64.RawURLEncoding.EncodeToString(big.NewInt(int64(publicKey.E)).Bytes())

	jwks := map[string]interface{}{
		"keys": []map[string]interface{}{
			{
				"kty": "RSA",
				"alg": "RS256",
				"use": "sig",
				"kid": "test-key-id",
				"n":   n,
				"e":   e,
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(jwks)
}

// handleAuthorize simulates the authorization endpoint
func (m *MockOIDCServer) handleAuthorize(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	redirectURI := r.URL.Query().Get("redirect_uri")

	// Simulate successful authorization with a code
	code := "mock-auth-code"
	redirectURL := fmt.Sprintf("%s?code=%s&state=%s", redirectURI, code, state)

	http.Redirect(w, r, redirectURL, http.StatusFound)
}

// handleToken simulates the token endpoint
func (m *MockOIDCServer) handleToken(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	grantType := r.Form.Get("grant_type")

	var accessToken, refreshToken, idToken string
	var err error

	switch grantType {
	case "authorization_code":
		code := r.Form.Get("code")
		if code != "mock-auth-code" {
			http.Error(w, "invalid code", http.StatusBadRequest)
			return
		}
		accessToken, refreshToken, idToken, err = m.generateTokens("test-user")

	case "refresh_token":
		refreshTokenValue := r.Form.Get("refresh_token")
		if !strings.HasPrefix(refreshTokenValue, "mock-refresh-token") {
			http.Error(w, "invalid refresh token", http.StatusBadRequest)
			return
		}
		accessToken, refreshToken, idToken, err = m.generateTokens("test-user")

	default:
		http.Error(w, "unsupported grant type", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, "failed to generate tokens", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"access_token":  accessToken,
		"token_type":    "Bearer",
		"expires_in":    3600,
		"refresh_token": refreshToken,
		"id_token":      idToken,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

// generateTokens generates mock JWT tokens
func (m *MockOIDCServer) generateTokens(subject string) (string, string, string, error) {
	now := time.Now()

	// Generate ID token
	idTokenClaims := jwt.MapClaims{
		"iss": m.Issuer,
		"sub": subject,
		"aud": m.ClientID,
		"exp": now.Add(time.Hour).Unix(),
		"iat": now.Unix(),
	}

	idToken := jwt.NewWithClaims(jwt.SigningMethodRS256, idTokenClaims)
	idToken.Header["kid"] = "test-key-id"

	idTokenString, err := idToken.SignedString(m.PrivateKey)
	if err != nil {
		return "", "", "", err
	}

	// Generate access token
	accessTokenClaims := jwt.MapClaims{
		"iss": m.Issuer,
		"sub": subject,
		"aud": m.ClientID,
		"exp": now.Add(time.Hour).Unix(),
		"iat": now.Unix(),
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodRS256, accessTokenClaims)
	accessTokenString, err := accessToken.SignedString(m.PrivateKey)
	if err != nil {
		return "", "", "", err
	}

	// Generate refresh token (simple mock)
	refreshToken := fmt.Sprintf("mock-refresh-token-%d", now.Unix())

	return accessTokenString, refreshToken, idTokenString, nil
}
