package common

import (
	"errors"
	"math"
	"regexp"
	"strconv"
	"strings"
)

var hostPortRegexp = regexp.MustCompile(`(?P<host>.+):(?P<port>\d+)`)

func regexMatchToMap(re *regexp.Regexp, s string) map[string]string {
	match := re.FindStringSubmatch(s)

	result := make(map[string]string, 2)
	for i, name := range re.SubexpNames() {
		// result[name] = match[i]
		if i != 0 {
			result[name] = match[i]
		}
	}

	return result
}

func SplitHostPort(s string) (host string, port int, err error) {
	s = strings.Trim(s, "\t\n\r ")
	if len(s) == 0 {
		return "", 0, errors.New("Invalid address: " + s)
	}

	result := regexMatchToMap(hostPortRegexp, s)

	var exists bool
	if host, exists = result["host"]; !exists {
		return "", -1, errors.New("Host not found")
	}

	if strPort, exists := result["port"]; !exists {
		return "", -1, errors.New("Port not found")
	} else {
		port, _ = strconv.Atoi(strPort)
	}

	return host, port, nil
}

func Round(val float64, roundOn float64, places int) (newVal float64) {
	var round float64
	pow := math.Pow(10, float64(places))
	digit := pow * val
	_, div := math.Modf(digit)
	if div >= roundOn {
		round = math.Ceil(digit)
	} else {
		round = math.Floor(digit)
	}
	newVal = round / pow
	return
}

func DeleteEmpty(s []string) []string {
	var r []string
	for _, str := range s {
		if strings.Trim(str, " ") != "" {
			r = append(r, str)
		}
	}
	return r
}
