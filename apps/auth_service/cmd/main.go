package main

import (
	"github.com/phuslu/log"

	"github.com/carlosealves2/short-stream/authservice/internal/bootstrap"
	"github.com/carlosealves2/short-stream/authservice/internal/config"
	"github.com/carlosealves2/short-stream/authservice/pkg/logger"
)

func main() {
	// Initialize global logger first
	appLogger := logger.NewGlobal(log.InfoLevel)

	cfg, err := config.NewBuilder().WithEnv().Build()
	if err != nil {
		appLogger.Fatal().Err(err).Msg("Failed to load configuration")
	}

	app, err := bootstrap.New(cfg, appLogger)
	if err != nil {
		appLogger.Fatal().Err(err).Msg("Failed to initialize application")
	}

	if err := app.Run(); err != nil {
		appLogger.Fatal().Err(err).Msg("Failed to start server")
	}
}
