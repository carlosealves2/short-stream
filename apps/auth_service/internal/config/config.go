package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the auth service
type Config struct {
	App   *AppConfig
	OIDC  *OIDCConfig
	Redis *RedisConfig
}

// ConfigBuilder builds configuration from various sources
//
//nolint:revive // ConfigBuilder is idiomatic for builder pattern
type ConfigBuilder struct {
	config *Config
}

// NewBuilder creates a new ConfigBuilder
func NewBuilder() *ConfigBuilder {
	return &ConfigBuilder{
		config: &Config{},
	}
}

// WithEnv loads configuration from environment variables
func (b *ConfigBuilder) WithEnv() *ConfigBuilder {
	// Try to load .env file (optional in production)
	_ = godotenv.Load()

	b.config.App = newAppConfig()
	b.config.OIDC = newOIDCConfig()
	b.config.Redis = newRedisConfig()

	return b
}

// Validate checks if the configuration is valid
func (b *ConfigBuilder) Validate() error {
	// Validate App config
	if b.config.App.FrontendURL == "" {
		return fmt.Errorf("FRONTEND_URL is required")
	}

	// Validate OIDC config
	if b.config.OIDC.ProviderURL == "" {
		return fmt.Errorf("OIDC_PROVIDER_URL is required")
	}
	if b.config.OIDC.ClientID == "" {
		return fmt.Errorf("OIDC_CLIENT_ID is required")
	}
	if b.config.OIDC.ClientSecret == "" {
		return fmt.Errorf("OIDC_CLIENT_SECRET is required")
	}
	if b.config.OIDC.RedirectURL == "" {
		return fmt.Errorf("OIDC_REDIRECT_URL is required")
	}

	// Validate Redis config
	if b.config.Redis.Addr == "" {
		return fmt.Errorf("REDIS_ADDR is required")
	}

	return nil
}

// Build validates and returns the final configuration
func (b *ConfigBuilder) Build() (*Config, error) {
	if err := b.Validate(); err != nil {
		return nil, err
	}
	return b.config, nil
}

// getEnv is a generic function to get environment variables with type safety
func getEnv[T string | int | bool](key string, defaultValue T) T {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}

	var result any
	var err error

	switch any(defaultValue).(type) {
	case string:
		result = valueStr
	case int:
		result, err = strconv.Atoi(valueStr)
		if err != nil {
			return defaultValue
		}
	case bool:
		result, err = strconv.ParseBool(valueStr)
		if err != nil {
			return defaultValue
		}
	}

	return result.(T)
}
