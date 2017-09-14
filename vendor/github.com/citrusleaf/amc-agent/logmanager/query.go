package logmanager

type TimeQueryIndex struct { // For QUERY
	filePath string
	pos      int64
}

var fromTimeQueryIndex, toTimeQueryIndex TimeQueryIndex
