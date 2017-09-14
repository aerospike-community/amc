package util

import (
	"bufio"
	"bytes"
	"errors"
	"strings"
	"time"
)

// logLevel signifies log line's level: INFO, DEBUG, ...
type logLevel string

const (
	ERROR   logLevel = "ERROR"
	WARNING logLevel = "WARNING"
	INFO    logLevel = "INFO"
	DEBUG   logLevel = "DEBUG"
	DETAIL  logLevel = "DETAIL"
)

var logLevelRank = map[logLevel]int{
	ERROR:   5,
	WARNING: 4,
	INFO:    3,
	DEBUG:   2,
	DETAIL:  1,
}

const forLogLevel = 5
const forLogContext = 6
const logLevelErrorString = "Invalid LogLevel"

type LogFilter struct {
	from, to          time.Time
	logContextFilters []string
	logLevelFilter    logLevel
	keywords          []string // TODO: This requires a full text index, (can of worms!)
	Filters           []FilterFunc
}

// func (lf *LogFilter) IsTail() bool {
// 	return lf.To.Zero()
// }

func NewLogFilter(from, to time.Time, logContextFilter []string, logLevelFilter string, keywords []string, filters []FilterFunc) (*LogFilter, error) {

	if logLevelRank[logLevel(strings.ToUpper(logLevelFilter))] == 0 && logLevelFilter != "" {
		return nil, errors.New(logLevelErrorString)
	}

	return &LogFilter{
		from:              from,
		to:                to,
		logContextFilters: logContextFilter,
		logLevelFilter:    logLevel(logLevelFilter),
		keywords:          keywords,
		Filters:           filters}, nil
}

type FilterFunc func(*LogFilter, []byte) bool

func FilterForLevel(lFilter *LogFilter, lineBuf []byte) bool {
	logLevelInBytes, err := extractLogValue(lineBuf, forLogLevel)
	if err != nil {
		return false
	}
	extractedLogLevelValue := logLevel(string(logLevelInBytes))
	if logLevelRank[extractedLogLevelValue] >= logLevelRank[lFilter.logLevelFilter] {
		return true
	}
	return false
}

func FilterForContext(lFilter *LogFilter, lineBuf []byte) bool {
	logContextInBytes, err := extractLogValue(lineBuf, forLogContext)
	if err != nil {
		return false
	}
	for _, logContextFilter := range lFilter.logContextFilters {
		if string(logContextInBytes) == "("+logContextFilter+"):" {
			return true
		}
	}
	return false
}

func FilterForKeyword(lFilter *LogFilter, lineBuf []byte) bool {
	for _, keyword := range lFilter.keywords {
		if bytes.Contains(lineBuf, []byte(keyword)) {
			return true
		}
	}
	return false
}

// used to get Log Level and Log Context Value
func extractLogValue(lineBuf []byte, flag int) ([]byte, error) {
	var offset int

	for i := 0; i < flag; i++ {
		advance, _, err := bufio.ScanWords(lineBuf[offset:], true)
		if err != nil {
			Log.Error("Error in scanning words, ", err.Error())
			return nil, err
		}
		offset += advance
	}
	_, token, err := bufio.ScanWords(lineBuf[offset:], true)
	if err != nil {
		Log.Error("Error in scanning words, ", err.Error())
		return nil, err
	}

	return token, nil
}
