package controllers

import "github.com/citrusleaf/amc/models"

func toAMCRoles(u *models.User) []interface{} {
	res := []interface{}{"api:general"}
	for _, role := range u.Roles {
		res = append(res, "api:"+role)
	}

	if registerEnterprise != nil {
		res = append(res, "api:enterprise")
	}

	return res
}
