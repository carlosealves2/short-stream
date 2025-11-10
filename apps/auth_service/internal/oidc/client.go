// Package oidc provides OpenID Connect authentication client implementation
package oidc

import (
	"context"
	"fmt"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"

	"github.com/carlosealves2/short-stream/authservice/internal/config"
)

// Client is an OIDC authentication client that handles OAuth2 flows
type Client struct {
	provider     *oidc.Provider
	oauth2Config *oauth2.Config
	verifier     *oidc.IDTokenVerifier
}

// NewClient creates a new OIDC client with the given configuration
func NewClient(ctx context.Context, cfg *config.OIDCConfig) (*Client, error) {
	provider, err := oidc.NewProvider(ctx, cfg.ProviderURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create OIDC provider: %w", err)
	}

	oauth2Config := &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.RedirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       cfg.Scopes,
	}

	verifier := provider.Verifier(&oidc.Config{
		ClientID: cfg.ClientID,
	})

	return &Client{
		provider:     provider,
		oauth2Config: oauth2Config,
		verifier:     verifier,
	}, nil
}

// GetAuthURL generates the authorization URL for the OIDC flow
func (c *Client) GetAuthURL(state string) string {
	return c.oauth2Config.AuthCodeURL(state)
}

// ExchangeCode exchanges the authorization code for tokens
func (c *Client) ExchangeCode(ctx context.Context, code string) (*oauth2.Token, error) {
	token, err := c.oauth2Config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code for token: %w", err)
	}

	// Verify the ID token
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return nil, fmt.Errorf("no id_token in token response")
	}

	if _, err := c.verifier.Verify(ctx, rawIDToken); err != nil {
		return nil, fmt.Errorf("failed to verify ID token: %w", err)
	}

	return token, nil
}

// RefreshToken refreshes an access token using a refresh token
func (c *Client) RefreshToken(ctx context.Context, refreshToken string) (*oauth2.Token, error) {
	tokenSource := c.oauth2Config.TokenSource(ctx, &oauth2.Token{
		RefreshToken: refreshToken,
	})

	newToken, err := tokenSource.Token()
	if err != nil {
		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}

	return newToken, nil
}

// VerifyIDToken verifies the ID token signature and claims
func (c *Client) VerifyIDToken(ctx context.Context, rawIDToken string) (*oidc.IDToken, error) {
	idToken, err := c.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return nil, fmt.Errorf("failed to verify ID token: %w", err)
	}
	return idToken, nil
}

// GetEndSessionURL generates the OIDC logout URL (RP-Initiated Logout)
// This logs the user out from the OIDC provider (Keycloak)
func (c *Client) GetEndSessionURL(idToken, postLogoutRedirectURI string) string {
	// Get the end_session_endpoint from the provider's discovery document
	var claims struct {
		EndSessionEndpoint string `json:"end_session_endpoint"`
	}

	if err := c.provider.Claims(&claims); err != nil {
		// Fallback: construct the URL manually for Keycloak
		// This is a safe fallback since we know we're using Keycloak
		return ""
	}

	if claims.EndSessionEndpoint == "" {
		return ""
	}

	// Build the logout URL with parameters
	logoutURL := fmt.Sprintf("%s?id_token_hint=%s&post_logout_redirect_uri=%s",
		claims.EndSessionEndpoint,
		idToken,
		postLogoutRedirectURI,
	)

	return logoutURL
}
