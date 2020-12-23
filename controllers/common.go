package controllers

import (
	"github.com/aerospike-community/amc/models"
)

//----------
// Handlers
//----------

// NodeResult strunct
type NodeResult struct {
	Node        *models.Node
	Name        string
	Status      string
	Err         error
	UnsetParams []string
}

func errorMap(err string) map[string]interface{} {
	return map[string]interface{}{
		"status": "failure",
		"error":  err,
	}
}
