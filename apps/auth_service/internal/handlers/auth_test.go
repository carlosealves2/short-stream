package handlers

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/phuslu/log"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/carlosealves2/short-stream/authservice/internal/config"
	"github.com/carlosealves2/short-stream/authservice/internal/oidc"
	"github.com/carlosealves2/short-stream/authservice/internal/testutil/mocks"
	"github.com/carlosealves2/short-stream/authservice/pkg/logger"
)

const (
	cookieAccessToken = "access_token"
	cookieIDToken     = "id_token"
	cookieSessionID   = "session_id"
)

func setupTestHandler(t *testing.T) (*AuthHandler, *mocks.MockStore, *mocks.MockOIDCServer) {
	mockStore := &mocks.MockStore{}
	mockOIDCServer, err := mocks.NewMockOIDCServer()
	require.NoError(t, err)

	cfg := &config.OIDCConfig{
		ProviderURL:  mockOIDCServer.Issuer,
		ClientID:     mockOIDCServer.ClientID,
		ClientSecret: "test-secret",
		RedirectURL:  mockOIDCServer.RedirectURL,
		Scopes:       []string{"openid"},
	}

	ctx := context.Background()
	oidcClient, err := oidc.NewClient(ctx, cfg)
	require.NoError(t, err)

	appConfig := &config.AppConfig{
		FrontendURL:    "http://localhost:3000",
		CookieDomain:   "localhost",
		CookieSecure:   false,
		CookieHTTPOnly: true,
		SessionMaxAge:  3600,
	}

	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	handler := NewAuthHandler(oidcClient, mockStore, appConfig, testLogger)

	return handler, mockStore, mockOIDCServer
}

func TestNewAuthHandler(t *testing.T) {
	handler, _, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	assert.NotNil(t, handler)
	assert.NotNil(t, handler.oidcClient)
	assert.NotNil(t, handler.store)
	assert.NotNil(t, handler.appConfig)
	assert.NotNil(t, handler.logger)
}

func TestAuthHandler_Login_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("CreateState", mock.Anything).Return("test-state", nil)

	router := gin.New()
	router.GET("/auth/login", handler.Login)

	req := httptest.NewRequest("GET", "/auth/login", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusFound, w.Code)
	location := w.Header().Get("Location")
	assert.NotEmpty(t, location)
	assert.Contains(t, location, mockServer.Issuer)
	assert.Contains(t, location, "state=test-state")

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Login_CreateStateError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("CreateState", mock.Anything).Return("", errors.New("storage error"))

	router := gin.New()
	router.GET("/auth/login", handler.Login)

	req := httptest.NewRequest("GET", "/auth/login", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Contains(t, w.Body.String(), "failed to create state")

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Callback_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("ValidateState", mock.Anything, "test-state").Return(nil)
	mockStore.On("CreateSession", mock.Anything, mock.AnythingOfType("string")).Return("session-123", nil)

	router := gin.New()
	router.GET("/auth/callback", handler.Callback)

	req := httptest.NewRequest("GET", "/auth/callback?code=mock-auth-code&state=test-state", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusFound, w.Code)
	assert.Equal(t, "http://localhost:3000", w.Header().Get("Location"))

	// Check cookies
	cookies := w.Result().Cookies()
	cookieNames := make(map[string]bool)
	for _, cookie := range cookies {
		cookieNames[cookie.Name] = true
	}
	assert.True(t, cookieNames[cookieAccessToken], "access_token cookie should be set")
	assert.True(t, cookieNames[cookieIDToken], "id_token cookie should be set")
	assert.True(t, cookieNames[cookieSessionID], "session_id cookie should be set")

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Callback_MissingCode(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	router := gin.New()
	router.GET("/auth/callback", handler.Callback)

	req := httptest.NewRequest("GET", "/auth/callback?state=test-state", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "missing code or state")

	mockStore.AssertNotCalled(t, "ValidateState")
}

func TestAuthHandler_Callback_MissingState(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	router := gin.New()
	router.GET("/auth/callback", handler.Callback)

	req := httptest.NewRequest("GET", "/auth/callback?code=mock-auth-code", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "missing code or state")

	mockStore.AssertNotCalled(t, "ValidateState")
}

func TestAuthHandler_Callback_InvalidState(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("ValidateState", mock.Anything, "invalid-state").Return(errors.New("invalid state"))

	router := gin.New()
	router.GET("/auth/callback", handler.Callback)

	req := httptest.NewRequest("GET", "/auth/callback?code=mock-auth-code&state=invalid-state", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "invalid state")

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Callback_CreateSessionError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("ValidateState", mock.Anything, "test-state").Return(nil)
	mockStore.On("CreateSession", mock.Anything, mock.AnythingOfType("string")).Return("", errors.New("storage error"))

	router := gin.New()
	router.GET("/auth/callback", handler.Callback)

	req := httptest.NewRequest("GET", "/auth/callback?code=mock-auth-code&state=test-state", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Contains(t, w.Body.String(), "failed to create session")

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Refresh_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("GetRefreshToken", mock.Anything, "session-123").Return("mock-refresh-token-123", nil)
	mockStore.On("UpdateSession", mock.Anything, "session-123", mock.AnythingOfType("string")).Return(nil)

	router := gin.New()
	router.POST("/auth/refresh", handler.Refresh)

	req := httptest.NewRequest("POST", "/auth/refresh", nil)
	req.AddCookie(&http.Cookie{Name: cookieSessionID, Value: "session-123"})
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "token refreshed")

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Refresh_MissingSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	router := gin.New()
	router.POST("/auth/refresh", handler.Refresh)

	req := httptest.NewRequest("POST", "/auth/refresh", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "missing session")

	mockStore.AssertNotCalled(t, "GetRefreshToken")
}

func TestAuthHandler_Refresh_InvalidSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("GetRefreshToken", mock.Anything, "invalid-session").Return("", errors.New("session not found"))

	router := gin.New()
	router.POST("/auth/refresh", handler.Refresh)

	req := httptest.NewRequest("POST", "/auth/refresh", nil)
	req.AddCookie(&http.Cookie{Name: cookieSessionID, Value: "invalid-session"})
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid session")

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Logout_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("DeleteSession", mock.Anything, "session-123").Return(nil)

	router := gin.New()
	router.POST("/auth/logout", handler.Logout)

	req := httptest.NewRequest("POST", "/auth/logout", nil)
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "session-123"})
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusFound, w.Code)
	assert.NotEmpty(t, w.Header().Get("Location"))

	// Check that cookies are cleared
	cookies := w.Result().Cookies()
	for _, cookie := range cookies {
		if cookie.Name == cookieAccessToken || cookie.Name == cookieIDToken || cookie.Name == cookieSessionID {
			assert.Equal(t, -1, cookie.MaxAge, "Cookie %s should be cleared", cookie.Name)
		}
	}

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Logout_WithoutSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	router := gin.New()
	router.POST("/auth/logout", handler.Logout)

	req := httptest.NewRequest("POST", "/auth/logout", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusFound, w.Code)
	assert.NotEmpty(t, w.Header().Get("Location"))

	mockStore.AssertNotCalled(t, "DeleteSession")
}

func TestAuthHandler_SetCookie(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, _, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	router := gin.New()
	router.GET("/test", func(c *gin.Context) {
		handler.setCookie(c, "test_cookie", "test_value", 3600)
		c.String(200, "ok")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	cookies := w.Result().Cookies()
	assert.Len(t, cookies, 1)
	assert.Equal(t, "test_cookie", cookies[0].Name)
	assert.Equal(t, "test_value", cookies[0].Value)
	assert.Equal(t, 3600, cookies[0].MaxAge)
	assert.Equal(t, "/", cookies[0].Path)
	assert.Equal(t, "localhost", cookies[0].Domain)
	assert.False(t, cookies[0].Secure)
	assert.True(t, cookies[0].HttpOnly)
}

func TestAuthHandler_ClearCookie(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, _, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	router := gin.New()
	router.GET("/test", func(c *gin.Context) {
		handler.clearCookie(c, "test_cookie")
		c.String(200, "ok")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	cookies := w.Result().Cookies()
	assert.Len(t, cookies, 1)
	assert.Equal(t, "test_cookie", cookies[0].Name)
	assert.Equal(t, "", cookies[0].Value)
	assert.Equal(t, -1, cookies[0].MaxAge)
}

func TestAuthHandler_Callback_TokenExpiry(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("ValidateState", mock.Anything, "test-state").Return(nil)
	mockStore.On("CreateSession", mock.Anything, mock.AnythingOfType("string")).Return("session-123", nil)

	router := gin.New()
	router.GET("/auth/callback", handler.Callback)

	req := httptest.NewRequest("GET", "/auth/callback?code=mock-auth-code&state=test-state", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusFound, w.Code)

	// Verify that cookies have appropriate max age
	cookies := w.Result().Cookies()
	for _, cookie := range cookies {
		switch cookie.Name {
		case cookieAccessToken, cookieIDToken:
			// Tokens should expire in about 1 hour (3600 seconds)
			assert.Greater(t, cookie.MaxAge, 3500)
			assert.Less(t, cookie.MaxAge, 3700)
		case cookieSessionID:
			assert.Equal(t, 3600, cookie.MaxAge)
		}
	}

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Refresh_WithTokenRotation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	oldRefreshToken := "mock-refresh-token-old"
	mockStore.On("GetRefreshToken", mock.Anything, "session-123").Return(oldRefreshToken, nil)
	mockStore.On("UpdateSession", mock.Anything, "session-123", mock.AnythingOfType("string")).Return(nil)

	router := gin.New()
	router.POST("/auth/refresh", handler.Refresh)

	req := httptest.NewRequest("POST", "/auth/refresh", nil)
	req.AddCookie(&http.Cookie{Name: cookieSessionID, Value: "session-123"})
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify UpdateSession was called (token rotation)
	mockStore.AssertCalled(t, "UpdateSession", mock.Anything, "session-123", mock.AnythingOfType("string"))
	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Logout_WithIDToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("DeleteSession", mock.Anything, "session-123").Return(nil)

	router := gin.New()
	router.POST("/auth/logout", handler.Logout)

	req := httptest.NewRequest("POST", "/auth/logout", nil)
	req.AddCookie(&http.Cookie{Name: cookieSessionID, Value: "session-123"})
	req.AddCookie(&http.Cookie{Name: cookieIDToken, Value: "test-id-token"})
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusFound, w.Code)
	location := w.Header().Get("Location")
	assert.NotEmpty(t, location)
	// Should redirect to OIDC logout endpoint
	assert.Contains(t, location, mockServer.Issuer+"/logout")
	assert.Contains(t, location, "id_token_hint=test-id-token")

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Logout_DeleteSessionError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	mockStore.On("DeleteSession", mock.Anything, "session-123").Return(errors.New("delete error"))

	router := gin.New()
	router.POST("/auth/logout", handler.Logout)

	req := httptest.NewRequest("POST", "/auth/logout", nil)
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "session-123"})
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Should still redirect even if session deletion fails
	assert.Equal(t, http.StatusFound, w.Code)
	assert.NotEmpty(t, w.Header().Get("Location"))

	// Verify cookies are still cleared
	cookies := w.Result().Cookies()
	for _, cookie := range cookies {
		if cookie.Name == cookieAccessToken || cookie.Name == cookieIDToken || cookie.Name == cookieSessionID {
			assert.Equal(t, -1, cookie.MaxAge, "Cookie %s should be cleared", cookie.Name)
		}
	}

	mockStore.AssertExpectations(t)
}

func TestAuthHandler_Logout_NoIDTokenNoSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, mockStore, mockServer := setupTestHandler(t)
	defer mockServer.Close()

	router := gin.New()
	router.POST("/auth/logout", handler.Logout)

	req := httptest.NewRequest("POST", "/auth/logout", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Should redirect to frontend (fallback)
	assert.Equal(t, http.StatusFound, w.Code)
	assert.Equal(t, "http://localhost:3000", w.Header().Get("Location"))

	// Verify cookies are cleared
	cookies := w.Result().Cookies()
	for _, cookie := range cookies {
		if cookie.Name == cookieAccessToken || cookie.Name == cookieIDToken || cookie.Name == cookieSessionID {
			assert.Equal(t, -1, cookie.MaxAge, "Cookie %s should be cleared", cookie.Name)
		}
	}

	mockStore.AssertNotCalled(t, "DeleteSession")
}
