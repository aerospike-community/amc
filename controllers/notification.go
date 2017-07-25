package controllers

import (
	"sort"
	"strconv"

	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
)

// NotificationController implements the notification resource.
type NotificationController struct {
	*goa.Controller
}

// NewNotificationController creates a notification controller.
func NewNotificationController(service *goa.Service) *NotificationController {
	return &NotificationController{Controller: service.NewController("NotificationController")}
}

// Query runs the query action.
func (c *NotificationController) Query(ctx *app.QueryNotificationContext) error {
	// NotificationController_Query: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	lastId := 0
	if ctx.LastID != nil {
		lastId = *ctx.LastID
	}

	alerts := common.AlertsById(cluster.AlertsFrom(int64(lastId)))
	sort.Sort(alerts)

	res := make([]*app.AerospikeAmcNotificationResponse, 0, len(alerts))
	for _, alert := range alerts {
		res = append(res, &app.AerospikeAmcNotificationResponse{
			ID:          strconv.FormatInt(alert.Id, 10),
			ConnID:      alert.ClusterId,
			Desc:        alert.Desc,
			Status:      string(alert.Status),
			Type:        "alert",
			LastOccured: int(alert.LastOccured.UnixNano() / 1e6),
		})
	}

	// NotificationController_Query: end_implement
	return ctx.OK(res)
}
