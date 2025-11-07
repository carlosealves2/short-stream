package logger

import (
	"bytes"
	"testing"

	"github.com/phuslu/log"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewGlobal(t *testing.T) {
	tests := []struct {
		name  string
		level log.Level
	}{
		{
			name:  "InfoLevel",
			level: log.InfoLevel,
		},
		{
			name:  "DebugLevel",
			level: log.DebugLevel,
		},
		{
			name:  "WarnLevel",
			level: log.WarnLevel,
		},
		{
			name:  "ErrorLevel",
			level: log.ErrorLevel,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger := NewGlobal(tt.level)
			require.NotNil(t, logger)
			// Apenas verificar que o logger foi criado
			// Os métodos podem retornar nil dependendo do nível
		})
	}
}

func TestNew(t *testing.T) {
	buf := &bytes.Buffer{}
	logger := New(buf, log.InfoLevel)

	require.NotNil(t, logger)
	// Apenas verificar que o logger foi criado
}

func TestLoggerInfo(t *testing.T) {
	buf := &bytes.Buffer{}
	logger := New(buf, log.InfoLevel)

	logger.Info().Str("test", "value").Msg("test message")

	// Verificar que algo foi escrito
	assert.Greater(t, buf.Len(), 0)
}

func TestLoggerError(t *testing.T) {
	buf := &bytes.Buffer{}
	logger := New(buf, log.InfoLevel)

	logger.Error().Str("error", "test error").Msg("error message")

	// Verificar que algo foi escrito
	assert.Greater(t, buf.Len(), 0)
}

func TestLoggerWarn(t *testing.T) {
	buf := &bytes.Buffer{}
	logger := New(buf, log.InfoLevel)

	logger.Warn().Str("warning", "test warning").Msg("warning message")

	// Verificar que algo foi escrito
	assert.Greater(t, buf.Len(), 0)
}

func TestLoggerDebug(t *testing.T) {
	buf := &bytes.Buffer{}

	t.Run("DebugEnabled", func(t *testing.T) {
		buf.Reset()
		logger := New(buf, log.DebugLevel)
		logger.Debug().Str("debug", "test").Msg("debug message")

		// Debug deve aparecer quando nível é Debug
		assert.Greater(t, buf.Len(), 0)
	})

	t.Run("DebugDisabled", func(t *testing.T) {
		buf.Reset()
		logger := New(buf, log.InfoLevel)
		logger.Debug().Str("debug", "test").Msg("debug message")

		// Debug não deve aparecer quando nível é Info
		assert.Equal(t, 0, buf.Len())
	})
}

func TestLoggerWithStructuredData(t *testing.T) {
	buf := &bytes.Buffer{}
	logger := New(buf, log.InfoLevel)

	logger.Info().
		Str("string_field", "value").
		Int("int_field", 42).
		Bool("bool_field", true).
		Msg("structured log")

	output := buf.String()
	assert.Contains(t, output, "string_field")
	assert.Contains(t, output, "int_field")
	assert.Contains(t, output, "bool_field")
	assert.Contains(t, output, "structured log")
}

func TestLoggerFatal(t *testing.T) {
	buf := &bytes.Buffer{}
	logger := New(buf, log.InfoLevel)

	// Não podemos testar realmente Fatal pois ele chama os.Exit
	// Mas podemos verificar que o método existe
	assert.NotNil(t, logger.Fatal())
}

func TestLoggerInterface(t *testing.T) {
	buf := &bytes.Buffer{}
	var _ Logger = New(buf, log.InfoLevel)
	// Se compilar, o teste passa - verifica que implementa a interface
}
