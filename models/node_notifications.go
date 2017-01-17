package models

import (
	"fmt"
	"time"

	// log "github.com/Sirupsen/logrus"
	// "github.com/satori/go.uuid"

	"github.com/citrusleaf/amc/common"
)

func (n *Node) AlertsFrom(id int64) []*common.Alert {
	return n.alerts.AlertsFrom(n.Address(), id)
}

func (n *Node) CheckStatus(latestState common.Stats) {

	messages := common.Info{
		"red":   "Node <strong>%s</strong> is down",
		"green": "Node <strong>%s</strong> is up now",
	}

	switch n.Status() {
	case nodeStatus.Off:
		alert := common.Alert{
			Id:          time.Now().UnixNano(),
			ClusterId:   n.cluster.Id(),
			Type:        common.AlertTypeNodeStatus,
			NodeAddress: n.Address(),
			Desc:        fmt.Sprintf(messages["red"], n.Address()),
			Created:     time.Now(),
			LastOccured: time.Now(),
			Status:      common.AlertStatusRed,
		}

		n.alerts.Register(&alert)
	case nodeStatus.On:
		if latestState.TryString("status", "") == string(nodeStatus.Off) {
			alert := common.Alert{
				Id:          time.Now().UnixNano(),
				ClusterId:   n.cluster.Id(),
				Type:        common.AlertTypeNodeStatus,
				NodeAddress: n.Address(),
				Desc:        fmt.Sprintf(messages["green"], n.Address()),
				Status:      common.AlertStatusGreen,
			}
			n.alerts.Register(&alert)
		}

	}

	n.setAlertState("status", string(n.Status()))
}

func (n *Node) CheckClusterVisibility(latestState common.Stats) {

	messages := common.Info{
		"red":   "Node <strong>%s</strong> is not visible to rest of the cluster",
		"green": "Node <strong>%s</strong> is now visible to rest of the cluster",
	}

	switch n.VisibilityStatus() {
	case nodeVisibilityStatus.Off:
		alert := common.Alert{
			Id:          time.Now().UnixNano(),
			ClusterId:   n.cluster.Id(),
			Type:        common.AlertTypeNodeVisibility,
			NodeAddress: n.Address(),
			Desc:        fmt.Sprintf(messages["red"], n.Address()),
			Created:     time.Now(),
			LastOccured: time.Now(),
			Status:      common.AlertStatusRed,
		}

		n.alerts.Register(&alert)
	case nodeVisibilityStatus.On:
		if latestState.TryString("visibility", "") == string(nodeVisibilityStatus.Off) {
			alert := common.Alert{
				Id:          time.Now().UnixNano(),
				ClusterId:   n.cluster.Id(),
				Type:        common.AlertTypeNodeVisibility,
				NodeAddress: n.Address(),
				Desc:        fmt.Sprintf(messages["green"], n.Address()),
				Status:      common.AlertStatusGreen,
			}
			n.alerts.Register(&alert)
		}

	}

	n.setAlertState("visibility", string(n.VisibilityStatus()))
}

func (n *Node) CheckTransactionQueue(latestState common.Stats) {
	queueLimit := 10000

	messages := common.Info{
		"yellow": "Transactions pending in queue for node <strong>%s</strong> is greater than %s",
		"green":  "Transactions pending in queue for node <strong>%s</strong> is less than %s now",
	}

	queueIfc := n.StatsAttr("queue")
	queue, exists := queueIfc.(int)
	if !exists {
		return
	}

	queueAlert := "on"
	if queue < queueLimit {
		queueAlert = "off"
	}

	switch queueAlert {
	case "on":
		alert := common.Alert{
			Id:          time.Now().UnixNano(),
			ClusterId:   n.cluster.Id(),
			Type:        common.AlertTypeNodeTransQueue,
			NodeAddress: n.Address(),
			Desc:        fmt.Sprintf(messages["yellow"], n.Address(), queueLimit),
			Created:     time.Now(),
			LastOccured: time.Now(),
			Status:      common.AlertStatusRed,
		}

		n.alerts.Register(&alert)
	case "off":
		if latestState.TryString("queueAlert", "") == "on" {
			alert := common.Alert{
				Id:          time.Now().UnixNano(),
				ClusterId:   n.cluster.Id(),
				Type:        common.AlertTypeNodeTransQueue,
				NodeAddress: n.Address(),
				Desc:        fmt.Sprintf(messages["green"], n.Address(), queueLimit),
				Status:      common.AlertStatusGreen,
			}
			n.alerts.Register(&alert)
		}
	}

	n.setAlertState("queueAlert", string(queueAlert))
}

func (n *Node) CheckFileDescriptors(latestState common.Stats) {
	messages := common.Info{
		"red":    "Client connections to node <strong>%s</strong> above 95%% of limit",
		"yellow": "Client connections to node <strong>%s</strong> above 90%% of limit",
		"green":  "Client connections to node <strong>%s</strong> below 90%% of limit now",
	}

	fdLimitIfc := n.ConfigAttr("proto-fd-max")
	fdLimit, exists := fdLimitIfc.(int)
	if !exists {
		return
	}

	fdIfc := n.StatsAttr("client_connections")
	fd, exists := fdIfc.(int)
	if !exists {
		return
	}

	fdAlert := "on"
	if float64(fd) <= float64(fdLimit)*0.9 {
		fdAlert = "off"
	}

	switch fdAlert {
	case "on":
		msg := messages["yellow"]
		status := common.AlertStatusYellow
		if float64(fd)/float64(fdLimit) > 0.95 {
			msg = messages["red"]
			status = common.AlertStatusRed
		}

		alert := common.Alert{
			Id:          time.Now().UnixNano(),
			ClusterId:   n.cluster.Id(),
			Type:        common.AlertTypeNodeFileDescriptors,
			NodeAddress: n.Address(),
			Desc:        fmt.Sprintf(msg, n.Address()),
			Created:     time.Now(),
			LastOccured: time.Now(),
			Status:      status,
		}

		n.alerts.Register(&alert)
	case "off":
		if latestState.TryString("fdAlert", "") == "on" {
			alert := common.Alert{
				Id:          time.Now().UnixNano(),
				ClusterId:   n.cluster.Id(),
				Type:        common.AlertTypeNodeFileDescriptors,
				NodeAddress: n.Address(),
				Desc:        fmt.Sprintf(messages["green"], n.Address()),
				Status:      common.AlertStatusGreen,
			}
			n.alerts.Register(&alert)
		}
	}

	n.setAlertState("fdAlert", string(fdAlert))
}

func (n *Node) CheckDiskSpace(latestState common.Stats) {
	messages := common.Info{
		"red":    "Free disk space on node <strong>%s</strong> below 5%%",
		"yellow": "Free disk space on node <strong>%s</strong> below 10%%",
		"green":  "Free disk space on node <strong>%s</strong> above 10%% now",
	}

	disk := n.Disk()
	diskSpaceLimit := disk.TryFloat("total-bytes-disk", 0)
	diskSpace := disk.TryFloat("used-bytes-disk", 0)

	diskSpaceAlert := "on"
	if diskSpace <= diskSpaceLimit*0.9 {
		diskSpaceAlert = "off"
	}

	switch diskSpaceAlert {
	case "on":
		msg := messages["yellow"]
		status := common.AlertStatusYellow
		if diskSpace/diskSpaceLimit > 0.95 {
			msg = messages["red"]
			status = common.AlertStatusRed
		}

		alert := common.Alert{
			Id:          time.Now().UnixNano(),
			ClusterId:   n.cluster.Id(),
			Type:        common.AlertTypeNodeDisk,
			NodeAddress: n.Address(),
			Desc:        fmt.Sprintf(msg, n.Address()),
			Created:     time.Now(),
			LastOccured: time.Now(),
			Status:      status,
		}

		n.alerts.Register(&alert)
	case "off":
		if latestState.TryString("diskSpaceAlert", "") == "on" {
			alert := common.Alert{
				Id:          time.Now().UnixNano(),
				ClusterId:   n.cluster.Id(),
				Type:        common.AlertTypeNodeDisk,
				NodeAddress: n.Address(),
				Desc:        fmt.Sprintf(messages["green"], n.Address()),
				Status:      common.AlertStatusGreen,
			}
			n.alerts.Register(&alert)
		}
	}

	n.setAlertState("diskSpaceAlert", string(diskSpaceAlert))
}

func (n *Node) CheckMemory(latestState common.Stats) {
	messages := common.Info{
		"red":    "Free Memory on node <strong>%s</strong> below 5%%",
		"yellow": "Free Memory on node <strong>%s</strong> below 10%%",
		"green":  "Free Memory on node <strong>%s</strong> above 10%% now",
	}

	memory := n.Memory()
	memSpaceLimit := memory.TryFloat("total-bytes-memory", 0)
	memSpace := memory.TryFloat("used-bytes-memory", 0)

	memSpaceAlert := "on"
	if memSpace <= memSpaceLimit*0.9 {
		memSpaceAlert = "off"
	}

	switch memSpaceAlert {
	case "on":
		msg := messages["yellow"]
		status := common.AlertStatusYellow
		if memSpace/memSpaceLimit > 0.95 {
			msg = messages["red"]
			status = common.AlertStatusRed
		}

		alert := common.Alert{
			Id:          time.Now().UnixNano(),
			ClusterId:   n.cluster.Id(),
			Type:        common.AlertTypeNodeDisk,
			NodeAddress: n.Address(),
			Desc:        fmt.Sprintf(msg, n.Address()),
			Created:     time.Now(),
			LastOccured: time.Now(),
			Status:      status,
		}

		n.alerts.Register(&alert)
	case "off":
		if latestState.TryString("memSpaceAlert", "") == "on" {
			alert := common.Alert{
				Id:          time.Now().UnixNano(),
				ClusterId:   n.cluster.Id(),
				Type:        common.AlertTypeNodeDisk,
				NodeAddress: n.Address(),
				Desc:        fmt.Sprintf(messages["green"], n.Address()),
				Status:      common.AlertStatusGreen,
			}
			n.alerts.Register(&alert)
		}
	}

	n.setAlertState("memSpaceAlert", string(memSpaceAlert))
}
