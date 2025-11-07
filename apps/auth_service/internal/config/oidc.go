package config

// OIDCConfig holds OpenID Connect provider configuration
type OIDCConfig struct {
	ProviderURL  string
	ClientID     string
	ClientSecret string
	RedirectURL  string
	Scopes       []string
}

func newOIDCConfig() *OIDCConfig {
	return &OIDCConfig{
		ProviderURL:  getEnv("OIDC_PROVIDER_URL", ""),
		ClientID:     getEnv("OIDC_CLIENT_ID", ""),
		ClientSecret: getEnv("OIDC_CLIENT_SECRET", ""),
		RedirectURL:  getEnv("OIDC_REDIRECT_URL", ""),
		Scopes:       []string{"openid", "profile", "email"},
	}
}
