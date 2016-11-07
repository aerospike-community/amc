package common

type IndexType string

var indexType = struct {
	STRING  IndexType
	NUMERIC IndexType
}{"string", "numeric"}
