package common

import (
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

const NOT_SUPPORTED = "N/S"
const NOT_AVAILABLE = "N/A"

// SinglePointValue struct
type SinglePointValue struct {
	timestamp *int64
	value     *float64
}

// NewSinglePointValue - create new PointValue for graphs
func NewSinglePointValue(timestamp *int64, value *float64) *SinglePointValue {
	return &SinglePointValue{
		timestamp: timestamp,
		value:     value,
	}
}

// Timestamp - get timestamp for graph
func (spv *SinglePointValue) Timestamp(mult int64) *int64 {
	if spv == nil {
		return nil
	}

	if spv.timestamp != nil {
		val := *spv.timestamp * mult
		return &val
	}

	return spv.timestamp
}

// TimestampJSON - return timestamp at unix time
func (spv *SinglePointValue) TimestampJSON(defVal *time.Time) *int64 {
	if spv == nil {
		if defVal != nil {
			val := defVal.Unix() * 1000
			return &val
		}
		return nil
	}

	if spv.timestamp != nil {
		val := *spv.timestamp * 1000
		return &val
	}

	return spv.timestamp
}

// Value - return SinglePointValue value or default
func (spv *SinglePointValue) Value(defVal *float64) *float64 {
	if spv == nil || spv.value == nil {
		return defVal
	}

	return spv.value
}

// Info - map type
type Info map[string]string

// Stats - map type
type Stats map[string]interface{}

// Clone - clone Info object
func (s Info) Clone() Info {
	res := make(Info, len(s))
	for k, v := range s {
		res[k] = v
	}
	return res
}

// Get - get info value from Info object
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

// GetMulti - get info value(s) from Info object
func (s Info) GetMulti(names ...string) Info {
	res := make(Info, len(names))
	for _, name := range names {
		if val, exists := s[name]; exists {
			res[name] = val
		} else {
			res[name] = NOT_AVAILABLE
		}
	}

	return res
}

// Int - Value MUST exist, and MUST be an int64 or a convertible string.
// Panics if the above constraints are not met
func (s Info) Int(name string, aliases ...string) int64 {
	value, err := strconv.ParseInt(s.Get(name, aliases...).(string), 10, 64)
	if err != nil {
		panic(err)
	}

	return value
}

// TryInt - Value should be an int64 or a convertible string; otherwise defValue is returned
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

// Float - Value MUST exist, and MUST be an float64 or a convertible string.
// Panics if the above constraints are not met
func (s Info) Float(name string, aliases ...string) float64 {
	value, err := strconv.ParseFloat(s.Get(name, aliases...).(string), 64)
	if err != nil {
		panic(err)
	}
	return value
}

// TryFloat - Value should be an float64 or a convertible string; otherwise defValue is returned
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

// TryString - Value should be a string; otherwise defValue is returned
// this function never panics
func (s Info) TryString(name string, defValue string, aliases ...string) string {
	field := s.Get(name, aliases...)
	if field != nil {
		return field.(string)
	}
	return defValue
}

// TryNumericValue - Value should be an float64, int64 or a convertible string; otherwise defValue is returned
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
	// first check if both are Stats
	if v1S, ok := v1.(Stats); ok {
		if v2S, ok := v2.(Stats); ok {
			res := Stats{}
			res.AggregateStats(v1S)
			res.AggregateStats(v2S)
			return res
		}
	}

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

// AggregateInfo - Value should be an float64 or a convertible string; otherwise defValue is returned
// this function never panics
func AggregateInfo(s Info, other Info) Stats {
	res := make(Stats, len(other))
	for k := range s {
		v := s.TryNumericValue(k, nil)
		if v != nil {
			res[k] = v
		}
	}

	for k := range other {
		sValue := res[k]
		oValue := other.TryNumericValue(k, 0)
		if val := addValues(sValue, oValue); val != nil {
			res[k] = val
		}
	}

	return res
}

// ToInfo - Value should be an stats or a convertible string; otherwise nil is returns
// this function never panics
func (s Info) ToInfo(name string) Info {
	res := Info{}
	name = strings.Trim(s[name], ";")
	statsPairStr := strings.Split(name, ";")
	for _, sp := range statsPairStr {
		statsPair := strings.SplitN(sp, "=", 2)
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

// ToInfoMap - Value should be an stats or a convertible string; otherwise nil is returns
// this function never panics
func (s Info) ToInfoMap(name string, alias string, delim string) map[string]Info {
	infoMap := map[string]Info{}

	statsFragsTrimmed := strings.Trim(s[name], ";")
	if statsFragsTrimmed == "" {
		return infoMap
	}

	statsFrags := strings.Split(statsFragsTrimmed, ";")
	for _, frag := range statsFrags {
		res := Info{}
		statsPairStr := strings.Split(frag, delim)
		for _, sp := range statsPairStr {
			statsPair := strings.SplitN(sp, "=", 2)
			switch len(statsPair) {
			case 1:
				res[statsPair[0]] = ""
			case 2:
				res[statsPair[0]] = statsPair[1]
			default:
				panic(sp)
			}
		}

		infoMap[res[alias]] = res
	}

	return infoMap
}

// ToStatsMap - Value should be an stats or a convertible string; otherwise nil is returns
// this function never panics
func (s Info) ToStatsMap(name string, alias string, delim string) map[string]Stats {
	statsMap := map[string]Stats{}

	statsFragsTrimmed := strings.Trim(s[name], ";")
	if statsFragsTrimmed == "" {
		return statsMap
	}

	statsFrags := strings.Split(statsFragsTrimmed, ";")
	for _, frag := range statsFrags {
		res := Info{}
		statsPairStr := strings.Split(frag, delim)
		for _, sp := range statsPairStr {
			statsPair := strings.SplitN(sp, "=", 2)
			switch len(statsPair) {
			case 1:
				res[statsPair[0]] = ""
			case 2:
				res[statsPair[0]] = statsPair[1]
			default:
				panic(sp)
			}
		}

		statsMap[res[alias]] = res.ToStats()
	}

	return statsMap
}

// ToStats - Value should be an stats or a convertible string; otherwise nil is returns
// this function never panics
func (s Info) ToStats() Stats {
	res := Stats{}

	for k, valStr := range s {
		// if strings.ToLower(valStr) == "true" {
		// 	res[k] = true
		// } else if strings.ToLower(valStr) == "false" {
		// 	res[k] = false
		if value, err := strconv.ParseInt(valStr, 10, 64); err == nil {
			res[k] = value
		} else if value, err := strconv.ParseFloat(valStr, 64); err == nil {
			res[k] = value
		} else {
			res[k] = valStr
		}
	}

	return res
}

// Clone - clone Stats
func (s Stats) Clone() Stats {
	res := make(Stats, len(s))
	for k, v := range s {
		res[k] = v
	}
	return res
}

// AggregateStats - Value should be an float64 or a convertible string
// this function never panics
func (s Stats) AggregateStats(other Stats) {
	for k, v := range other {
		if val := addValues(s[k], v); val != nil {
			s[k] = val
		}
	}
}

// ToStringValues - conver Stats to string
func (s Stats) ToStringValues() map[string]interface{} {
	res := make(map[string]interface{}, len(s))
	for k, sv := range s {
		switch v := sv.(type) {
		case string:
			res[k] = v
		case int64:
			res[k] = strconv.FormatInt(v, 10)
		case float64:
			res[k] = strconv.FormatFloat(v, 'f', -1, 64)
		case bool:
			res[k] = strconv.FormatBool(v)
		default:
			res[k] = v
		}
	}

	return res
}

// Get - get item from Stats
func (s Stats) Get(name string, aliases ...string) interface{} {
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

// ExistsGet - get item from stats if exists
func (s Stats) ExistsGet(name string) (interface{}, bool) {
	val, exists := s[name]
	return val, exists
}

// GetMulti - get item(s) from stats
func (s Stats) GetMulti(names ...string) Stats {
	res := make(Stats, len(names))
	for _, name := range names {
		if val, exists := s[name]; exists {
			res[name] = val
		} else {
			res[name] = NOT_AVAILABLE
		}
	}

	return res
}

// Del - delete item from Stats
func (s Stats) Del(names ...string) {
	for _, name := range names {
		delete(s, name)
	}
}

// TryInt - Value should be an int64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s Stats) TryInt(name string, defValue int64, aliases ...string) int64 {
	field := s.Get(name, aliases...)
	if field != nil {
		if value, ok := field.(int64); ok {
			return value
		}
		if value, ok := field.(float64); ok {
			return int64(value)
		}
	}
	return defValue
}

// Int - Value should be an int64, and should exist; otherwise panics
func (s Stats) Int(name string, aliases ...string) int64 {
	field := s.Get(name, aliases...)
	return field.(int64)
}

// TryFloat - Value should be an float64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s Stats) TryFloat(name string, defValue float64, aliases ...string) float64 {
	field := s.Get(name, aliases...)
	if field != nil {
		if value, ok := field.(float64); ok {
			return value
		}
		if value, ok := field.(int64); ok {
			return float64(value)
		}
	}
	return defValue
}

// TryString - Value should be an int64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s Stats) TryString(name string, defValue string, aliases ...string) string {
	field := s.Get(name, aliases...)
	if field != nil {
		if value, ok := field.(string); ok {
			return value
		}
	}
	return defValue
}

/**********************************************************************
*					Type SyncInfo
***********************************************************************/

// SyncInfo struct
type SyncInfo struct {
	_Info Info

	mutex sync.RWMutex
}

// NewSyncInfo - return sync info
func NewSyncInfo(info Info) *SyncInfo {
	return &SyncInfo{
		_Info: info,
	}
}

// SetInfo - set sync info
func (s *SyncInfo) SetInfo(info Info) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s._Info = info
}

// Clone - clone sync info
func (s *SyncInfo) Clone() Info {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.Clone()
}

// Get SyncInfo
func (s *SyncInfo) Get(name string, aliases ...string) interface{} {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.Get(name, aliases...)
}

// GetMulti SyncInfo
func (s *SyncInfo) GetMulti(names ...string) Info {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.GetMulti(names...)
}

// Int - Value MUST exist, and MUST be an int64 or a convertible string.
// Panics if the above constraints are not met
func (s *SyncInfo) Int(name string, aliases ...string) int64 {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.Int(name, aliases...)
}

// TryInt - Value should be an int64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s *SyncInfo) TryInt(name string, defValue int64, aliases ...string) int64 {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.TryInt(name, defValue, aliases...)
}

// Float - Value MUST exist, and MUST be an float64 or a convertible string.
// Panics if the above constraints are not met
func (s *SyncInfo) Float(name string, aliases ...string) float64 {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.Float(name, aliases...)
}

// TryFloat - Value should be an float64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s *SyncInfo) TryFloat(name string, defValue float64, aliases ...string) float64 {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.TryFloat(name, defValue, aliases...)
}

// TryString - Value should be a string; otherwise defValue is returned
// this function never panics
func (s *SyncInfo) TryString(name string, defValue string, aliases ...string) string {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.TryString(name, defValue, aliases...)
}

// TryNumericValue - Value should be an float64, int64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s *SyncInfo) TryNumericValue(name string, defVal interface{}, aliases ...string) interface{} {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.TryNumericValue(name, defVal, aliases...)
}

// ToInfo Syncinfo to info
func (s *SyncInfo) ToInfo(name string) Info {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.ToInfo(name)
}

// ToInfoMap - Value should be an stats or a convertible string; otherwise nil is returns
// this function never panics
func (s *SyncInfo) ToInfoMap(name string, alias string, delim string) map[string]Info {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.ToInfoMap(name, alias, delim)
}

// ToStatsMap Syncinfo to statsMap
func (s *SyncInfo) ToStatsMap(name string, alias string, delim string) map[string]Stats {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Info.ToStatsMap(name, alias, delim)
}

/**********************************************************************
					Type SyncStats
***********************************************************************/

// SyncStats strunct
type SyncStats struct {
	_Stats Stats

	mutex sync.RWMutex
}

// NewSyncStats - create new SyncStats
func NewSyncStats(stats Stats) *SyncStats {
	return &SyncStats{
		_Stats: stats,
	}
}

// SetStats SyncStats set stats
func (s *SyncStats) SetStats(info Stats) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s._Stats = info
}

// Set - SyncStats set value
func (s *SyncStats) Set(name string, value interface{}) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s._Stats[name] = value
}

// Clone - SyncStats clone
func (s *SyncStats) Clone() Stats {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Stats.Clone()
}

// Exists - SyncStats check if key exists
func (s *SyncStats) Exists(name string) bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	_, exists := s._Stats[name]
	return exists
}

// CloneInto - SyncStats clone info
func (s *SyncStats) CloneInto(res Stats) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	for k, v := range s._Stats {
		res[k] = v
	}
}

// Get - SyncStats get value
func (s *SyncStats) Get(name string, aliases ...string) interface{} {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Stats.Get(name, aliases...)
}

// ExistsGet - SyncStats get stat if exists
func (s *SyncStats) ExistsGet(name string) (interface{}, bool) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Stats.ExistsGet(name)
}

// GetMulti - SyncStats - get multi keys
func (s *SyncStats) GetMulti(names ...string) Stats {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Stats.GetMulti(names...)
}

// Del - SyncStats - delete stat
func (s *SyncStats) Del(names ...string) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	s._Stats.Del(names...)
}

// Int - Value MUST exist, and MUST be an int64 or a convertible string.
// Panics if the above constraints are not met
func (s *SyncStats) Int(name string, aliases ...string) int64 {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Stats.Int(name, aliases...)
}

// TryInt - Value should be an int64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s *SyncStats) TryInt(name string, defValue int64, aliases ...string) int64 {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Stats.TryInt(name, defValue, aliases...)
}

// TryFloat - Value should be an float64 or a convertible string; otherwise defValue is returned
// this function never panics
func (s *SyncStats) TryFloat(name string, defValue float64, aliases ...string) float64 {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Stats.TryFloat(name, defValue, aliases...)
}

// TryString - Value should be a string; otherwise defValue is returned
// this function never panics
func (s *SyncStats) TryString(name string, defValue string, aliases ...string) string {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s._Stats.TryString(name, defValue, aliases...)
}

// AggregateStatsTo - Value should be an float64 or a convertible string
// this function never panics
func (s *SyncStats) AggregateStatsTo(other Stats) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	other.AggregateStats(s._Stats)
}

/*
	Utility functions
*/

// StatsBy is the type of a "less" function that defines the ordering of its Stats arguments.
type StatsBy func(fieldName string, p1, p2 Stats) bool

// ByFloatField - sort by float field
var ByFloatField = func(fieldName string, p1, p2 Stats) bool {
	return p1.TryFloat(fieldName, 0) < p2.TryFloat(fieldName, 0)
}

// ByIntField - sort by int field
var ByIntField = func(fieldName string, p1, p2 Stats) bool {
	return p1.TryInt(fieldName, 0) < p2.TryInt(fieldName, 0)
}

// ByStringField - sort by string field
var ByStringField = func(fieldName string, p1, p2 Stats) bool {
	return p1.TryString(fieldName, "") < p2.TryString(fieldName, "")
}

// Sort - stats sorter
func (by StatsBy) Sort(fieldName string, statsList []Stats) {
	ps := &statsSorter{
		fieldName: fieldName,
		statsList: statsList,
		by:        by, // The Sort method's receiver is the function (closure) that defines the sort order.
	}
	sort.Sort(ps)
}

// SortReverse - stats reverse sorter
func (by StatsBy) SortReverse(fieldName string, statsList []Stats) {
	ps := &statsSorter{
		fieldName: fieldName,
		statsList: statsList,
		by:        by, // The Sort method's receiver is the function (closure) that defines the sort order.
	}
	sort.Sort(sort.Reverse(ps))
}

// statsSorter joins a StatsBy function and a slice of statsList to be sorted.
type statsSorter struct {
	fieldName string
	statsList []Stats
	by        func(fieldName string, p1, p2 Stats) bool // Closure used in the Less method.
}

// Len is part of sort.Interface.
func (s *statsSorter) Len() int {
	return len(s.statsList)
}

// Swap is part of sort.Interface.
func (s *statsSorter) Swap(i, j int) {
	s.statsList[i], s.statsList[j] = s.statsList[j], s.statsList[i]
}

// Less is part of sort.Interface. It is implemented by calling the "by" closure in the sorter.
func (s *statsSorter) Less(i, j int) bool {
	return s.by(s.fieldName, s.statsList[i], s.statsList[j])
}
