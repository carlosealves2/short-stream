package middleware

import (
	"bytes"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/phuslu/log"
	"github.com/stretchr/testify/assert"

	"github.com/carlosealves2/short-stream/authservice/pkg/logger"
)

func TestLogger_LogsRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Logger(testLogger))
	router.GET("/test", func(c *gin.Context) {
		c.String(200, "ok")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Greater(t, buf.Len(), 0, "Logger should have written something")
}

func TestLogger_LogsMethod(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Logger(testLogger))
	router.POST("/test", func(c *gin.Context) {
		c.String(201, "created")
	})

	req := httptest.NewRequest("POST", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 201, w.Code)
	output := buf.String()
	assert.Contains(t, output, "POST")
}

func TestLogger_LogsPath(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Logger(testLogger))
	router.GET("/api/users", func(c *gin.Context) {
		c.String(200, "ok")
	})

	req := httptest.NewRequest("GET", "/api/users", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	output := buf.String()
	assert.Contains(t, output, "/api/users")
}

func TestLogger_LogsStatusCode(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Logger(testLogger))
	router.GET("/test", func(c *gin.Context) {
		c.String(404, "not found")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 404, w.Code)
	output := buf.String()
	assert.Contains(t, output, "404")
}

func TestLogger_LogsDuration(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Logger(testLogger))
	router.GET("/test", func(c *gin.Context) {
		c.String(200, "ok")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	output := buf.String()
	// Duration should be present in logs
	assert.Contains(t, output, "duration")
}

func TestLogger_WithMultipleRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Logger(testLogger))
	router.GET("/test1", func(c *gin.Context) {
		c.String(200, "ok")
	})
	router.GET("/test2", func(c *gin.Context) {
		c.String(200, "ok")
	})

	// First request
	req1 := httptest.NewRequest("GET", "/test1", nil)
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)

	// Second request
	req2 := httptest.NewRequest("GET", "/test2", nil)
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	output := buf.String()
	assert.Contains(t, output, "/test1")
	assert.Contains(t, output, "/test2")
}
