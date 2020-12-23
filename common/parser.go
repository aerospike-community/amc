package common

import (
	"bufio"
	"fmt"
	"strconv"
	"strings"
)

// InfoParser struct
type InfoParser struct {
	*bufio.Reader
}

// NewInfoParser - new info parser
func NewInfoParser(s string) *InfoParser {
	return &InfoParser{bufio.NewReader(strings.NewReader(s))}
}

// Expect expect a value, assert if not expected value
func (ip *InfoParser) Expect(s string) error {
	bytes := make([]byte, len(s))
	v, err := ip.Read(bytes)
	if err != nil {
		return err
	}
	if string(bytes) != s {
		return fmt.Errorf("InfoParser: Wrong value. Expected %s, found %d", s, v)
	}
	return nil
}

// ReadUntil - read until delimiter
func (ip *InfoParser) ReadUntil(delim byte) (string, error) {
	v, err := ip.ReadBytes(delim)

	switch len(v) {
	case 0:
		return string(v), err
	case 1:
		if v[0] == delim {
			return "", err
		}
		return string(v), err
	}
	return string(v[:len(v)-1]), err
}

// ReadFloat - read float
func (ip *InfoParser) ReadFloat(delim byte) (float64, error) {
	s, err := ip.ReadUntil(delim)
	if err != nil {
		return 0, err
	}

	return strconv.ParseFloat(s, 64)
}

// func (ip *InfoParser) ReadTime(delim byte) (time.Time, error) {
// 	s, err := ip.ReadUntil(delim)
// 	if err != nil {
// 		return time.Time{}, err
// 	}

// 	return time.Parse("2013-02-03 12:13:11-GMT", s)
// }
