package types

type StringSet struct {
	set map[string]struct{}
}

func NewStringSet(l int) *StringSet {
	return &StringSet{
		set: make(map[string]struct{}, l),
	}
}

func (ss *StringSet) Add(s string) {
	ss.set[s] = struct{}{}
}

func (ss *StringSet) Exists(s string) bool {
	_, exists := ss.set[s]
	return exists
}

func (ss *StringSet) Contents() []string {
	res := make([]string, 0, len(ss.set))
	for k, _ := range ss.set {
		res = append(res, k)
	}
	return res
}

func (ss *StringSet) Len() int {
	if ss == nil {
		return 0
	}

	return len(ss.set)
}
