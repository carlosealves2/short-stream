package middleware

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/carlosealves2/short-stream/authservice/pkg/logger"
)

func Logger(log logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		c.Next()

		duration := time.Since(start)
		statusCode := c.Writer.Status()

		log.Info().
			Str("method", method).
			Str("path", path).
			Int("status", statusCode).
			Dur("duration", duration).
			Msg("HTTP request")
	}
}
