package controllers

import "database/sql"

// . "github.com/ahmetalpbalkan/go-linq"

//----------
// Handlers
//----------

type NodeResult struct {
	Name   string
	Status string
	Err    error
}

func errorMap(err string) map[string]interface{} {
	return map[string]interface{}{
		"status": "failure",
		"error":  err,
	}
}

func payloadToNullString(s *string) sql.NullString {
	if s != nil {
		return sql.NullString{
			String: *s,
			Valid:  true,
		}
	}
	return sql.NullString{
		Valid: false,
	}
}
