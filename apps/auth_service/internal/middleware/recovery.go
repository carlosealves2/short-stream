package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/carlosealves2/short-stream/authservice/pkg/logger"
)

// Recovery returns a middleware that recovers from panics
func Recovery(log logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Error().
					Interface("error", err).
					Str("path", c.Request.URL.Path).
					Str("method", c.Request.Method).
					Msg("Panic recovered")

				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "internal server error",
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}
