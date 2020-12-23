package common

// StrUniq is checking for uniqe strings
func StrUniq(l []string) []string {
	if len(l) == 0 {
		return nil
	}

	set := map[string]struct{}{}
	for i := range l {
		set[l[i]] = struct{}{}
	}

	result := make([]string, 0, len(set))
	for k := range set {
		result = append(result, k)
	}

	return result
}
