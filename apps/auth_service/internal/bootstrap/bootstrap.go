package bootstrap

import (
	"context"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"github.com/carlosealves2/short-stream/authservice/internal/config"
	"github.com/carlosealves2/short-stream/authservice/internal/handlers"
	"github.com/carlosealves2/short-stream/authservice/internal/middleware"
	"github.com/carlosealves2/short-stream/authservice/internal/oidc"
	"github.com/carlosealves2/short-stream/authservice/internal/storage"
	"github.com/carlosealves2/short-stream/authservice/pkg/logger"
)

type App struct {
	router *gin.Engine
	config *config.Config
	logger logger.Logger
}

func New(cfg *config.Config, log logger.Logger) (*App, error) {
	app := &App{
		config: cfg,
		logger: log,
	}

	if err := app.initialize(); err != nil {
		return nil, err
	}

	return app, nil
}

func (a *App) initialize() error {
	// Initialize Redis
	redisClient, err := a.initRedis()
	if err != nil {
		return fmt.Errorf("failed to initialize Redis: %w", err)
	}

	// Initialize storage
	store := storage.NewRedisStore(redisClient, a.config.App.SessionMaxAge)

	// Initialize OIDC client
	oidcClient, err := a.initOIDC()
	if err != nil {
		return fmt.Errorf("failed to initialize OIDC: %w", err)
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(oidcClient, store, a.config.App, a.logger)

	// Setup router
	a.router = a.setupRouter(authHandler)

	return nil
}

func (a *App) initRedis() (redis.UniversalClient, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     a.config.Redis.Addr,
		Password: a.config.Redis.Password,
		DB:       a.config.Redis.DB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	a.logger.Info().Str("addr", a.config.Redis.Addr).Msg("Connected to Redis successfully")
	return client, nil
}

func (a *App) initOIDC() (*oidc.Client, error) {
	client, err := oidc.NewClient(context.Background(), a.config.OIDC)
	if err != nil {
		return nil, err
	}

	a.logger.Info().Str("provider", a.config.OIDC.ProviderURL).Msg("OIDC client initialized successfully")
	return client, nil
}

func (a *App) setupRouter(authHandler *handlers.AuthHandler) *gin.Engine {
	router := gin.New()

	// Apply middleware
	router.Use(middleware.Recovery(a.logger))
	router.Use(middleware.Logger(a.logger))
	router.Use(middleware.CORS([]string{a.config.App.FrontendURL}))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Auth routes
	authGroup := router.Group("/auth")
	{
		authGroup.GET("/login", authHandler.Login)
		authGroup.GET("/callback", authHandler.Callback)
		authGroup.POST("/refresh", authHandler.Refresh)
		authGroup.POST("/logout", authHandler.Logout)
	}

	return router
}

func (a *App) Run() error {
	addr := fmt.Sprintf(":%s", a.config.App.Port)
	a.logger.Info().Str("addr", addr).Msg("Starting auth service")
	return a.router.Run(addr)
}
