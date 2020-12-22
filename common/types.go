package common

import (
	"database/sql/driver"
	"time"
)

type JsonRawString string

// MarshalJSON returns *m as the JSON encoding of m.
func (m *JsonRawString) MarshalJSON() ([]byte, error) {
	return []byte(*m), nil
}

type IndexType string

var indexType = struct {
	STRING  IndexType
	NUMERIC IndexType
}{"string", "numeric"}

type NullTime struct {
	time  time.Time
	valid bool // Valid is true if Time is not NULL
}

// Set - sets the time
func (nt *NullTime) Set(t time.Time) {
	nt.time = t
	nt.valid = true
}

// Valid - check if Time is not NULL
func (nt *NullTime) Valid() bool {
	return nt.valid
}

// Scan implements the Scanner interface.
func (nt *NullTime) Scan(value interface{}) error {
	nt.time, nt.valid = value.(time.Time)
	return nil
}

// Value implements the driver Valuer interface.
func (nt NullTime) Value() (driver.Value, error) {
	if !nt.valid {
		return nil, nil
	}
	return nt.time, nil
}
