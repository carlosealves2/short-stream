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

func TestRecovery_HandlesNormalRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Recovery(testLogger))
	router.GET("/test", func(c *gin.Context) {
		c.String(200, "ok")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "ok", w.Body.String())
}

func TestRecovery_HandlesPanic(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Recovery(testLogger))
	router.GET("/test", func(c *gin.Context) { //nolint:revive // test handler
		panic("something went wrong")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 500, w.Code)
	assert.Contains(t, w.Body.String(), "internal server error")
}

func TestRecovery_LogsPanicDetails(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Recovery(testLogger))
	router.GET("/test", func(c *gin.Context) { //nolint:revive // test handler
		panic("test panic")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 500, w.Code)
	output := buf.String()
	assert.Contains(t, output, "Panic recovered")
	assert.Contains(t, output, "/test")
	assert.Contains(t, output, "GET")
}

func TestRecovery_WithPanicString(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Recovery(testLogger))
	router.GET("/test", func(c *gin.Context) { //nolint:revive // test handler
		panic("custom error message")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 500, w.Code)
	output := buf.String()
	assert.Contains(t, output, "custom error message")
}

func TestRecovery_WithPanicError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.ErrorLevel)

	router := gin.New()
	router.Use(Recovery(testLogger))
	router.GET("/test", func(c *gin.Context) { //nolint:revive // test handler
		panic(assert.AnError)
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 500, w.Code)
	assert.Greater(t, buf.Len(), 0)
}

func TestRecovery_DoesNotInterruptNormalFlow(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	handlerExecuted := false

	router := gin.New()
	router.Use(Recovery(testLogger))
	router.GET("/test", func(c *gin.Context) {
		handlerExecuted = true
		c.String(200, "ok")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.True(t, handlerExecuted)
	assert.Equal(t, 200, w.Code)
}

func TestRecovery_ReturnsJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := &bytes.Buffer{}
	testLogger := logger.New(buf, log.InfoLevel)

	router := gin.New()
	router.Use(Recovery(testLogger))
	router.GET("/test", func(c *gin.Context) { //nolint:revive // test handler
		panic("error")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, 500, w.Code)
	assert.Contains(t, w.Header().Get("Content-Type"), "application/json")
	assert.Contains(t, w.Body.String(), `"error"`)
}
