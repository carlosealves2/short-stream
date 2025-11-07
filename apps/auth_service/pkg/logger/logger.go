// Package logger provides structured logging functionality for the auth service
package logger

import (
	"io"
	"os"

	"github.com/phuslu/log"
)

// Logger is the interface for structured logging operations
type Logger interface {
	Info() *log.Entry
	Error() *log.Entry
	Warn() *log.Entry
	Debug() *log.Entry
	Fatal() *log.Entry
}

type logger struct {
	log.Logger
}

// NewGlobal creates a global logger with automatic terminal detection
// If running in a terminal, uses pretty colored output
// Otherwise, uses JSON format
func NewGlobal(level log.Level) Logger {
	var logWriter log.Writer

	if log.IsTerminal(os.Stderr.Fd()) {
		logWriter = &log.ConsoleWriter{
			ColorOutput:    true,
			QuoteString:    true,
			EndWithMessage: true,
		}
	} else {
		logWriter = &log.IOWriter{Writer: os.Stderr}
	}

	return &logger{
		Logger: log.Logger{
			Level:      level,
			TimeFormat: "15:04:05",
			Caller:     1,
			Writer:     logWriter,
		},
	}
}

// New creates a new logger with the given writer and level
func New(writer io.Writer, level log.Level) Logger {
	return &logger{
		Logger: log.Logger{
			Level:  level,
			Writer: &log.ConsoleWriter{Writer: writer},
		},
	}
}

func (l *logger) Info() *log.Entry {
	return l.Logger.Info()
}

func (l *logger) Error() *log.Entry {
	return l.Logger.Error()
}

func (l *logger) Warn() *log.Entry {
	return l.Logger.Warn()
}

func (l *logger) Debug() *log.Entry {
	return l.Logger.Debug()
}

func (l *logger) Fatal() *log.Entry {
	return l.Logger.Fatal()
}
