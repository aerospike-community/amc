package common

import (
	"strconv"
	"strings"
)

type Info map[string]string
type Stats map[string]interface{}

func (s Info) Get(name string, aliases ...string) interface{} {
	if val, exists := s[name]; exists {
		return val
	}

	for _, alias := range aliases {
		if val, exists := s[alias]; exists {
			return val
		}
	}

	return nil
}

// Value MUST exist, and MUST be an int64 or a convertible string.
// Panics if the above constraints are not met
func (s Info) Int(name string, aliases ...string) int64 {
	value, err := strconv.ParseInt(s.Get(name, aliases...).(string), 10, 64)
	if err != nil {
		panic(err)
	}

	return value
}

// Value should be an int64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s Info) TryInt(name string, defValue int64, aliases ...string) int64 {
	field := s.Get(name, aliases...)
	if field != nil {
		if value, err := strconv.ParseInt(field.(string), 10, 64); err == nil {
			return value
		}
	}
	return defValue
}

// Value MUST exist, and MUST be an float64 or a convertible string.
// Panics if the above constraints are not met
func (s Info) Float(name string, aliases ...string) float64 {
	value, err := strconv.ParseFloat(s.Get(name, aliases...).(string), 64)
	if err != nil {
		panic(err)
	}
	return value
}

// Value should be an float64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s Info) TryFloat(name string, defValue float64, aliases ...string) float64 {
	field := s.Get(name, aliases...)
	if field != nil {
		if value, err := strconv.ParseFloat(field.(string), 64); err == nil {
			return value
		}
	}
	return defValue
}

// Value should be a string; otherwise defValue is returned
// this function never panics
func (s Info) TryString(name string, defValue string, aliases ...string) string {
	field := s.Get(name, aliases...)
	if field != nil {
		return field.(string)
	}
	return defValue
}

// Value should be an float64, int64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s Info) TryNumericValue(name string, defVal interface{}, aliases ...string) interface{} {
	field := s.Get(name, aliases...)
	if field != nil {
		if value, err := strconv.ParseInt(field.(string), 10, 64); err == nil {
			return value
		}
		if value, err := strconv.ParseFloat(field.(string), 64); err == nil {
			return value
		}
	}
	return defVal
}

func addValues(v1, v2 interface{}) interface{} {
	v1Vali, v1i := v1.(int64)
	v2Vali, v2i := v2.(int64)

	v1Valf, v1f := v1.(float64)
	v2Valf, v2f := v2.(float64)

	if v1i && v2i {
		return v1Vali + v2Vali
	} else if v1f && v2f {
		return v1Valf + v2Valf
	} else if v1i && v2f {
		return float64(v1Vali) + v2Valf
	} else if v1f && v2i {
		return v1Valf + float64(v2Vali)
	} else if v2 == nil && (v1i || v1f) {
		return v1
	} else if v1 == nil && (v2i || v2f) {
		return v2
	}

	return nil
}

// Value should be an float64 or a convertible string; otherwise defValue is returned
// this function never panics
func AggregateInfo(s Info, other Info) Stats {
	res := make(Stats, len(other))
	for k, _ := range s {
		v := s.TryNumericValue(k, nil)
		if v != nil {
			res[k] = v
		}
	}

	for k, _ := range other {
		sValue := res[k]
		oValue := other.TryNumericValue(k, 0)
		if val := addValues(sValue, oValue); val != nil {
			res[k] = val
		}
	}

	return res
}

// Value should be an stats or a convertible string; otherwise nil is returns
// this function never panics
func (s Info) ToInfo(name string) Info {
	res := Info{}
	statsPairStr := strings.Split(s[name], ";")
	for _, sp := range statsPairStr {
		statsPair := strings.Split(sp, "=")
		switch len(statsPair) {
		case 1:
			res[statsPair[0]] = ""
		case 2:
			res[statsPair[0]] = statsPair[1]
		default:
		}
	}

	return res
}

// Value should be an stats or a convertible string; otherwise nil is returns
// this function never panics
func (s Info) ToInfoMap(name string, alias string, delim string) map[string]Info {
	infoMap := map[string]Info{}

	statsFrags := strings.Split(s[name], ";")
	for _, frag := range statsFrags {
		res := Info{}
		statsPairStr := strings.Split(frag, delim)
		for _, sp := range statsPairStr {
			statsPair := strings.Split(sp, "=")
			switch len(statsPair) {
			case 1:
				res[statsPair[0]] = ""
			case 2:
				res[statsPair[0]] = statsPair[1]
			default:
			}
		}

		infoMap[res[alias]] = res
	}

	return infoMap
}

// Value should be an stats or a convertible string; otherwise nil is returns
// this function never panics
func (s Info) ToStats() Stats {
	res := Stats{}

	for k, valStr := range s {
		if value, err := strconv.ParseInt(valStr, 10, 64); err == nil {
			res[k] = value
		} else if value, err := strconv.ParseFloat(valStr, 64); err == nil {
			res[k] = value
		}
	}

	return res
}

// Value should be an float64 or a convertible string
// this function never panics
func (s Stats) AggregateStats(other Stats) {
	for k, v := range other {
		if val := addValues(s[k], v); val != nil {
			s[k] = val
		}
	}
}
