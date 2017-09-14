package util

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	"github.com/Sirupsen/logrus"
)

// new instance of logger
var Log = logrus.New()

// setting up the logger
func NewAmcAgentLog(fPath string, level string) {
	setLogLevel(level)
	Log.Formatter = new(aerospikeFormatter)
	if len(fPath) != 0 {
		file, err := os.Create(fPath)
		if err == nil {
			Log.Formatter = new(aerospikeFormatter)
			Log.Out = file
		} else {
			Log.Info("Failed to log to file, using default stderr. Error : ", err)
		}
	}
}

func setLogLevel(level string) {
	lLevel := logLevel(level)
	switch lLevel {
	case ERROR:
		Log.Level = logrus.ErrorLevel
	case WARNING:
		Log.Level = logrus.WarnLevel
	case INFO:
		Log.Level = logrus.InfoLevel
	case DEBUG:
		Log.Level = logrus.DebugLevel
	case DETAIL:
		Log.Level = logrus.DebugLevel
	}
}

type aerospikeFormatter struct {
}

func (f *aerospikeFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	var b *bytes.Buffer
	keys := make([]string, 0, len(entry.Data))
	for k := range entry.Data {
		keys = append(keys, k)
	}

	if entry.Buffer != nil {
		b = entry.Buffer
	} else {
		b = &bytes.Buffer{}
	}

	timestampFormat := AsLogTimeFormat

	f.appendValue(b, entry.Time.Format(timestampFormat))
	b.WriteByte(':')
	b.WriteByte(' ')

	// appending the log level value
	f.appendValue(b, strings.ToUpper(entry.Level.String()))
	b.WriteByte(' ')

	// appending log context, file name and line no.
	f.appendValue(b, caller())
	b.WriteByte(' ')

	for _, key := range keys {
		f.appendValue(b, entry.Data[key])
	}

	if entry.Message != "" {
		f.appendValue(b, entry.Message)
	}

	b.WriteByte('\n')
	return b.Bytes(), nil
}

func caller() string {
	if _, file, line, ok := runtime.Caller(5); ok {
		return "(amcAgent):" + " (" + strings.Join([]string{filepath.Base(file), strconv.Itoa(line)}, ":") + ")"
	}
	// not sure what the convention should be here
	return ""
}

func (f *aerospikeFormatter) appendValue(b *bytes.Buffer, value interface{}) {
	switch value := value.(type) {
	case string:
		b.WriteString(value)
	case error:
		errmsg := value.Error()
		b.WriteString(errmsg)
	default:
		fmt.Fprint(b, value)
	}
}
