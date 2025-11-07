package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewBuilder(t *testing.T) {
	builder := NewBuilder()
	require.NotNil(t, builder)
	assert.NotNil(t, builder.config)
}

func TestConfigBuilder_WithEnv(t *testing.T) {
	// Set environment variables
	require.NoError(t, os.Setenv("PORT", "9090"))
	require.NoError(t, os.Setenv("OIDC_PROVIDER_URL", "https://test.com"))
	require.NoError(t, os.Setenv("OIDC_CLIENT_ID", "test-client"))
	require.NoError(t, os.Setenv("OIDC_CLIENT_SECRET", "test-secret"))
	require.NoError(t, os.Setenv("OIDC_REDIRECT_URL", "http://localhost/callback"))
	require.NoError(t, os.Setenv("FRONTEND_URL", "http://localhost:3000"))
	require.NoError(t, os.Setenv("REDIS_ADDR", "redis:6379"))
	defer func() {
		_ = os.Unsetenv("PORT")
		_ = os.Unsetenv("OIDC_PROVIDER_URL")
		_ = os.Unsetenv("OIDC_CLIENT_ID")
		_ = os.Setenv("OIDC_CLIENT_SECRET", "")
		_ = os.Unsetenv("OIDC_REDIRECT_URL")
		_ = os.Unsetenv("FRONTEND_URL")
		_ = os.Unsetenv("REDIS_ADDR")
	}()

	builder := NewBuilder().WithEnv()
	require.NotNil(t, builder)

	assert.Equal(t, "9090", builder.config.App.Port)
	assert.Equal(t, "https://test.com", builder.config.OIDC.ProviderURL)
	assert.Equal(t, "test-client", builder.config.OIDC.ClientID)
	assert.Equal(t, "redis:6379", builder.config.Redis.Addr)
}

func TestConfigBuilder_Validate_Success(t *testing.T) {
	builder := NewBuilder()
	builder.config.App = &AppConfig{FrontendURL: "http://localhost"}
	builder.config.OIDC = &OIDCConfig{
		ProviderURL:  "https://test.com",
		ClientID:     "test",
		ClientSecret: "secret",
		RedirectURL:  "http://localhost/callback",
	}
	builder.config.Redis = &RedisConfig{Addr: "redis:6379"}

	err := builder.Validate()
	assert.NoError(t, err)
}

func TestConfigBuilder_Validate_MissingFrontendURL(t *testing.T) {
	builder := NewBuilder()
	builder.config.App = &AppConfig{FrontendURL: ""}
	builder.config.OIDC = &OIDCConfig{
		ProviderURL:  "https://test.com",
		ClientID:     "test",
		ClientSecret: "secret",
		RedirectURL:  "http://localhost/callback",
	}
	builder.config.Redis = &RedisConfig{Addr: "redis:6379"}

	err := builder.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "FRONTEND_URL")
}

func TestConfigBuilder_Validate_MissingOIDCProvider(t *testing.T) {
	builder := NewBuilder()
	builder.config.App = &AppConfig{FrontendURL: "http://localhost"}
	builder.config.OIDC = &OIDCConfig{
		ProviderURL:  "",
		ClientID:     "test",
		ClientSecret: "secret",
		RedirectURL:  "http://localhost/callback",
	}
	builder.config.Redis = &RedisConfig{Addr: "redis:6379"}

	err := builder.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "OIDC_PROVIDER_URL")
}

func TestConfigBuilder_Build(t *testing.T) {
	require.NoError(t, os.Setenv("OIDC_PROVIDER_URL", "https://test.com"))
	require.NoError(t, os.Setenv("OIDC_CLIENT_ID", "test-client"))
	require.NoError(t, os.Setenv("OIDC_CLIENT_SECRET", "test-secret"))
	require.NoError(t, os.Setenv("OIDC_REDIRECT_URL", "http://localhost/callback"))
	require.NoError(t, os.Setenv("FRONTEND_URL", "http://localhost:3000"))
	defer func() {
		_ = os.Unsetenv("OIDC_PROVIDER_URL")
		_ = os.Unsetenv("OIDC_CLIENT_ID")
		_ = os.Unsetenv("OIDC_CLIENT_SECRET")
		_ = os.Unsetenv("OIDC_REDIRECT_URL")
		_ = os.Unsetenv("FRONTEND_URL")
	}()

	cfg, err := NewBuilder().WithEnv().Build()
	require.NoError(t, err)
	require.NotNil(t, cfg)
	assert.NotNil(t, cfg.App)
	assert.NotNil(t, cfg.OIDC)
	assert.NotNil(t, cfg.Redis)
}

func TestGetEnv_String(t *testing.T) {
	require.NoError(t, os.Setenv("TEST_STRING", "value"))
	defer func() { _ = os.Unsetenv("TEST_STRING") }()

	result := getEnv("TEST_STRING", "default")
	assert.Equal(t, "value", result)
}

func TestGetEnv_StringDefault(t *testing.T) {
	result := getEnv("NONEXISTENT_VAR", "default")
	assert.Equal(t, "default", result)
}

func TestGetEnv_Int(t *testing.T) {
	require.NoError(t, os.Setenv("TEST_INT", "42"))
	defer func() { _ = os.Unsetenv("TEST_INT") }()

	result := getEnv("TEST_INT", 0)
	assert.Equal(t, 42, result)
}

func TestGetEnv_IntDefault(t *testing.T) {
	result := getEnv("NONEXISTENT_INT", 99)
	assert.Equal(t, 99, result)
}

func TestGetEnv_Bool(t *testing.T) {
	require.NoError(t, os.Setenv("TEST_BOOL", "true"))
	defer func() { _ = os.Unsetenv("TEST_BOOL") }()

	result := getEnv("TEST_BOOL", false)
	assert.Equal(t, true, result)
}

func TestGetEnv_BoolDefault(t *testing.T) {
	result := getEnv("NONEXISTENT_BOOL", true)
	assert.Equal(t, true, result)
}
