package controllers

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
