package common

import (
	"database/sql"
	"errors"
	"math"
	"sort"
	"strconv"
	"strings"

	"github.com/citrusleaf/amc/pkg/bcrypt"
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

func Comma(v int64, sep string) string {
	sign := ""

	// minin64 can't be negated to a usable value, so it has to be special cased.
	if v == math.MinInt64 {
		return "-9,223,372,036,854,775,808"
	}

	if v < 0 {
		sign = "-"
		v = 0 - v
	}

	parts := []string{"", "", "", "", "", "", ""}
	j := len(parts) - 1

	for v > 999 {
		parts[j] = strconv.FormatInt(v%1000, 10)
		switch len(parts[j]) {
		case 2:
			parts[j] = "0" + parts[j]
		case 1:
			parts[j] = "00" + parts[j]
		}
		v = v / 1000
		j--
	}
	parts[j] = strconv.Itoa(int(v))
	return sign + strings.Join(parts[j:], sep)
}

func SortStrings(s []string) []string {
	sort.Strings(s)
	return s
}

func ToNullString(s string) sql.NullString {
	return sql.NullString{String: s, Valid: s != ""}
}

func MaxInt64(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}

func HashPassword(password string) ([]byte, error) {
	// Hashing the password with the cost of 10, with a static salt
	const salt = "$2a$10$1EqTTqA8hPqEF7fNZaFW3O"
	hashedPassword, err := bcrypt.Hash(password, salt)
	if err != nil {
		return nil, err
	}
	return []byte(hashedPassword), nil
}

// gcd returns the gcd of the two numbers.
func gcd(x, y int) int {
	for y != 0 {
		x, y = y, x%y
	}
	return x
}

// GCD returns the greatest common divisor of the numbers.
func GCD(x, y int, numbers ...int) int {
	z := gcd(x, y)
	for _, n := range numbers {
		z = gcd(z, n)
	}

	return z
}

// lcm returns the lcm of the two numbers
func lcm(x, y int) int {
	return x * y / gcd(x, y)
}

// LCM returns the least common multiple of the numbers.
func LCM(x, y int, numbers ...int) int {
	z := lcm(x, y)
	for _, n := range numbers {
		z = lcm(z, n)
	}

	return z
}
