// Package config provides configuration structures and builders for the auth service
package config

// AppConfig holds application-specific configuration
type AppConfig struct {
	Port string

	// Cookie settings
	CookieDomain   string
	CookieSecure   bool
	CookieHTTPOnly bool
	CookieSameSite string

	// Frontend URL for redirects after auth
	FrontendURL string

	// Session settings
	SessionMaxAge int // in seconds
}

func newAppConfig() *AppConfig {
	return &AppConfig{
		Port:           getEnv("PORT", "8080"),
		CookieDomain:   getEnv("COOKIE_DOMAIN", ""),
		CookieSecure:   getEnv("COOKIE_SECURE", true),
		CookieHTTPOnly: getEnv("COOKIE_HTTP_ONLY", true),
		CookieSameSite: getEnv("COOKIE_SAME_SITE", "Lax"),
		FrontendURL:    getEnv("FRONTEND_URL", ""),
		SessionMaxAge:  getEnv("SESSION_MAX_AGE", 3600),
	}
}
