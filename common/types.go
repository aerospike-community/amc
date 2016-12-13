package common

type JsonRawString string

// MarshalJSON returns *m as the JSON encoding of m.
func (m *JsonRawString) MarshalJSON() ([]byte, error) {
	return []byte(*m), nil
}

type NodeResult struct {
	Name string
	Err  error
}

type IndexType string

var indexType = struct {
	STRING  IndexType
	NUMERIC IndexType
}{"string", "numeric"}
