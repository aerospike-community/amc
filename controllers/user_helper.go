package controllers

import (
	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/models"
)

func toUserMedia(u *models.User) *app.AerospikeAmcUserQueryResponse {
	return &app.AerospikeAmcUserQueryResponse{
		Username: u.Username,
		Roles:    u.Roles,
		FullName: &u.FullName.String,
		Notes:    &u.Notes.String,
	}
}

func toUserMedias(conns []*models.User) []*app.AerospikeAmcUserQueryResponse {
	var res []*app.AerospikeAmcUserQueryResponse
	for _, u := range conns {
		res = append(res, toUserMedia(u))
	}

	return res
}

func toUser(ctx *app.SaveUserContext) *models.User {
	u := &models.User{
		Username: ctx.Payload.Username,
		Roles:    ctx.Payload.Roles,
		FullName: payloadToNullString(ctx.Payload.FullName),
		Notes:    payloadToNullString(ctx.Payload.Notes),
	}

	if ctx.Payload.Password != nil {
		u.SetPassword(*ctx.Payload.Password)
	}

	return u
}
