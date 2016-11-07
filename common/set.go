package common

func StrUniq(l []string) []string {
	if len(l) == 0 {
		return nil
	}

	set := map[string]struct{}{}
	for i := range l {
		set[l[i]] = struct{}{}
	}

	result := make([]string, 0, len(set))
	for k, _ := range set {
		result = append(result, k)
	}

	return result
}
