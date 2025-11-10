// Package handlers provides HTTP request handlers for the auth service
package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/carlosealves2/short-stream/authservice/internal/config"
	"github.com/carlosealves2/short-stream/authservice/internal/oidc"
	"github.com/carlosealves2/short-stream/authservice/internal/storage"
	"github.com/carlosealves2/short-stream/authservice/pkg/logger"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	oidcClient *oidc.Client
	store      storage.Store
	appConfig  *config.AppConfig
	logger     logger.Logger
}

// NewAuthHandler creates a new AuthHandler with the given dependencies
func NewAuthHandler(oidcClient *oidc.Client, store storage.Store, appConfig *config.AppConfig, log logger.Logger) *AuthHandler {
	return &AuthHandler{
		oidcClient: oidcClient,
		store:      store,
		appConfig:  appConfig,
		logger:     log,
	}
}

// Login initiates the OIDC authentication flow
func (h *AuthHandler) Login(c *gin.Context) {
	state, err := h.store.CreateState(c.Request.Context())
	if err != nil {
		h.logger.Error().Err(err).Msg("Failed to create state")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create state"})
		return
	}

	authURL := h.oidcClient.GetAuthURL(state)
	h.logger.Info().Str("auth_url", authURL).Msg("Redirecting to OIDC provider")
	c.Redirect(http.StatusFound, authURL)
}

// Callback handles the OIDC callback
func (h *AuthHandler) Callback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" || state == "" {
		h.logger.Warn().Msg("Missing code or state in callback")
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing code or state"})
		return
	}

	// Validate state
	if err := h.store.ValidateState(c.Request.Context(), state); err != nil {
		h.logger.Error().Err(err).Msg("Invalid state")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid state"})
		return
	}

	// Exchange code for tokens
	token, err := h.oidcClient.ExchangeCode(c.Request.Context(), code)
	if err != nil {
		h.logger.Error().Err(err).Msg("Failed to exchange code for tokens")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to exchange code"})
		return
	}

	// Create session with refresh token
	sessionID, err := h.store.CreateSession(c.Request.Context(), token.RefreshToken)
	if err != nil {
		h.logger.Error().Err(err).Msg("Failed to create session")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create session"})
		return
	}

	// Extract tokens
	accessToken := token.AccessToken
	idToken, _ := token.Extra("id_token").(string)

	// Set cookies
	h.setCookie(c, "access_token", accessToken, int(time.Until(token.Expiry).Seconds()))
	h.setCookie(c, "id_token", idToken, int(time.Until(token.Expiry).Seconds()))
	h.setCookie(c, "session_id", sessionID, h.appConfig.SessionMaxAge)

	h.logger.Info().Str("session_id", sessionID).Msg("User authenticated successfully")

	// Redirect to frontend
	c.Redirect(http.StatusFound, h.appConfig.FrontendURL)
}

// Refresh refreshes the access token using the refresh token
func (h *AuthHandler) Refresh(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		h.logger.Warn().Msg("Missing session cookie in refresh request")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing session"})
		return
	}

	// Get refresh token from storage
	refreshToken, err := h.store.GetRefreshToken(c.Request.Context(), sessionID)
	if err != nil {
		h.logger.Error().Err(err).Str("session_id", sessionID).Msg("Invalid or expired session")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}

	// Refresh the token
	newToken, err := h.oidcClient.RefreshToken(c.Request.Context(), refreshToken)
	if err != nil {
		h.logger.Error().Err(err).Msg("Failed to refresh token")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to refresh token"})
		return
	}

	// Update session with new refresh token if it changed
	if newToken.RefreshToken != "" && newToken.RefreshToken != refreshToken {
		if err := h.store.UpdateSession(c.Request.Context(), sessionID, newToken.RefreshToken); err != nil {
			h.logger.Error().Err(err).Msg("Failed to update session with new refresh token")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update session"})
			return
		}
	}

	// Extract tokens
	accessToken := newToken.AccessToken
	idToken, _ := newToken.Extra("id_token").(string)

	// Update cookies
	h.setCookie(c, "access_token", accessToken, int(time.Until(newToken.Expiry).Seconds()))
	if idToken != "" {
		h.setCookie(c, "id_token", idToken, int(time.Until(newToken.Expiry).Seconds()))
	}

	h.logger.Info().Str("session_id", sessionID).Msg("Token refreshed successfully")
	c.JSON(http.StatusOK, gin.H{"message": "token refreshed"})
}

// Logout logs out the user from the application and OIDC provider
func (h *AuthHandler) Logout(c *gin.Context) {
	// Get ID token for OIDC logout
	idToken, err := c.Cookie("id_token")
	if err != nil {
		h.logger.Warn().Msg("No ID token found in logout request")
		// Still proceed with local logout even if no ID token
	}

	// Delete session from storage
	sessionID, err := c.Cookie("session_id")
	if err == nil {
		if err := h.store.DeleteSession(c.Request.Context(), sessionID); err != nil {
			h.logger.Error().Err(err).Str("session_id", sessionID).Msg("Failed to delete session")
		} else {
			h.logger.Info().Str("session_id", sessionID).Msg("Session deleted successfully")
		}
	}

	// Clear cookies
	h.clearCookie(c, "access_token")
	h.clearCookie(c, "id_token")
	h.clearCookie(c, "session_id")

	// If we have an ID token, redirect to OIDC provider logout
	// This performs RP-Initiated Logout (logs out from Keycloak)
	if idToken != "" {
		logoutURL := h.oidcClient.GetEndSessionURL(idToken, h.appConfig.FrontendURL)
		if logoutURL != "" {
			h.logger.Info().Str("logout_url", logoutURL).Msg("Redirecting to OIDC provider logout")
			c.Redirect(http.StatusFound, logoutURL)
			return
		}
	}

	// Fallback: if no ID token or OIDC logout URL, just redirect to frontend
	h.logger.Info().Msg("Performing local logout only, redirecting to frontend")
	c.Redirect(http.StatusFound, h.appConfig.FrontendURL)
}

// Helper methods

func (h *AuthHandler) setCookie(c *gin.Context, name, value string, maxAge int) {
	c.SetCookie(
		name,
		value,
		maxAge,
		"/",
		h.appConfig.CookieDomain,
		h.appConfig.CookieSecure,
		h.appConfig.CookieHTTPOnly,
	)
}

func (h *AuthHandler) clearCookie(c *gin.Context, name string) {
	c.SetCookie(
		name,
		"",
		-1,
		"/",
		h.appConfig.CookieDomain,
		h.appConfig.CookieSecure,
		h.appConfig.CookieHTTPOnly,
	)
}
