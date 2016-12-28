package common

import (
	"errors"
	"math"
	"strconv"
	"strings"
)

func SplitHostPort(addr string) (host string, port int, err error) {
	addr = strings.Trim(addr, "\t\n\r ")
	if len(addr) == 0 {
		return "", 0, errors.New("Invalid address: " + addr)
	}

	index := strings.LastIndex(addr, ":")
	if index < 0 || len(addr) < index {
		return addr, 0, errors.New("Invalid address: " + addr)
	}

	portStr := addr[index+1:]
	if len(portStr) > 0 {
		var err error
		port, err = strconv.Atoi(portStr)
		if err != nil {
			return addr, 0, err
		}
	}
	return addr[:index], port, nil
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

func StrDiff(o, n []string) (added, removed []string) {
	for _, sn := range n {
		exists := false
		for _, so := range o {
			if sn == so {
				exists = true
				break
			}
		}
		if !exists {
			added = append(added, sn)
		}
	}

	for _, so := range o {
		exists := false
		for _, sn := range n {
			if sn == so {
				exists = true
				break
			}
		}
		if !exists {
			removed = append(removed, so)
		}
	}

	return added, removed
}
