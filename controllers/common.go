package controllers

import (
	"github.com/citrusleaf/amc/models"
)

//----------
// Handlers
//----------

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
