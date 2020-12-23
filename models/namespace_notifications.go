package models

import (
	"fmt"
	"strings"
	"time"

	// "github.com/satori/go.uuid"

	"github.com/aerospike-community/amc/common"
)

// CheckAvailablePct - check namespace available percents
func (ns *Namespace) CheckAvailablePct(latestState common.Stats) {

	messages := common.Info{
		"red":    "Contiguous Disk space available for new writes on namespace <strong>%s on %s</strong> below 10%%",
		"yellow": "Contiguous Disk space available for new writes on namespace <strong>%s on %s</strong> below 20%%",
		"green":  "Contiguous Disk space available for new writes on namespace <strong>%s on %s</strong> above 20%% now",
	}

	availablePct := latestState.TryInt("available_pct", 100)

	status := common.AlertStatusGreen
	if availablePct <= 10 {
		status = common.AlertStatusRed
	} else if availablePct <= 20 {
		status = common.AlertStatusYellow
	}

	alert := common.Alert{
		Id:          time.Now().UnixNano(),
		ClusterId:   ns.node.cluster.ID(),
		Type:        common.AlertTypeNamespaceAvailablePct,
		NodeAddress: ns.node.Address(),
		Namespace:   common.ToNullString(ns.name),
		Desc:        fmt.Sprintf(messages[string(status)], ns.name, ns.node.Address()),
		Created:     time.Now(),
		LastOccured: time.Now(),
		Status:      status,
	}

	ns.node.alerts().Register(&alert)
	// ns.node.setAlertState(ns.name+".AvailablePct", string(status))
}

// CheckDiskPctHighWatermark - check disk high water mark
func (ns *Namespace) CheckDiskPctHighWatermark(latestState common.Stats) {

	messages := common.Info{
		"yellow": "Used disk space for namespace <strong>%s on %s</strong> above high water mark",
		"green":  "Used disk space for namespace <strong>%s on %s</strong> below high water mark now",
	}

	usedDisk := 100 - latestState.TryInt("free-pct-disk", 100)
	highWatermark := latestState.TryInt("high-water-disk-pct", 100)

	status := common.AlertStatusGreen
	if highWatermark > 0 && usedDisk >= highWatermark {
		status = common.AlertStatusYellow
	}

	alert := common.Alert{
		Id:          time.Now().UnixNano(),
		ClusterId:   ns.node.cluster.ID(),
		Type:        common.AlertTypeNamespaceDiskPctHighWatermark,
		NodeAddress: ns.node.Address(),
		Namespace:   common.ToNullString(ns.name),
		Desc:        fmt.Sprintf(messages[string(status)], ns.name, ns.node.Address()),
		Created:     time.Now(),
		LastOccured: time.Now(),
		Status:      status,
	}

	ns.node.alerts().Register(&alert)
	// ns.node.setAlertState(ns.name+".AvailablePct", string(status))
}

// CheckDiskPctStopWrites - check disk stop writes limit
func (ns *Namespace) CheckDiskPctStopWrites(latestState common.Stats) {

	messages := common.Info{
		"red":   "Used disk space for namespace <strong>%s on %s</strong> above stop writes limit",
		"green": "Used disk space for namespace <strong>%s on %s</strong> below stop writes limit now",
	}

	stopWrites := strings.ToLower(latestState.TryString("stop-writes", "false"))

	status := common.AlertStatusGreen
	if stopWrites == "true" {
		status = common.AlertStatusRed
	}

	alert := common.Alert{
		Id:          time.Now().UnixNano(),
		ClusterId:   ns.node.cluster.ID(),
		Type:        common.AlertTypeNamespaceDiskPctStopWrites,
		NodeAddress: ns.node.Address(),
		Namespace:   common.ToNullString(ns.name),
		Desc:        fmt.Sprintf(messages[string(status)], ns.name, ns.node.Address()),
		Created:     time.Now(),
		LastOccured: time.Now(),
		Status:      status,
	}

	ns.node.alerts().Register(&alert)
	// ns.node.setAlertState(ns.name+".AvailablePct", string(status))
}

// CheckMemoryPctStopWrites - check memory stop writes limit
func (ns *Namespace) CheckMemoryPctStopWrites(latestState common.Stats) {

	messages := common.Info{
		"red":   "Used memory space for namespace <strong>%s on %s</strong> above stop writes limit",
		"green": "Used memory space for namespace <strong>%s on %s</strong> below stop writes limit now",
	}

	usedMem := 100 - latestState.TryInt("free-pct-memory", 100)
	highWatermark := latestState.TryInt("stop-writes-pct", 100)

	status := common.AlertStatusGreen
	if usedMem > highWatermark {
		status = common.AlertStatusRed
	}

	alert := common.Alert{
		Id:          time.Now().UnixNano(),
		ClusterId:   ns.node.cluster.ID(),
		Type:        common.AlertTypeNamespaceMemoryPctStopWrites,
		NodeAddress: ns.node.Address(),
		Namespace:   common.ToNullString(ns.name),
		Desc:        fmt.Sprintf(messages[string(status)], ns.name, ns.node.Address()),
		Created:     time.Now(),
		LastOccured: time.Now(),
		Status:      status,
	}

	ns.node.alerts().Register(&alert)
	// ns.node.setAlertState(ns.name+".AvailablePct", string(status))
}

// CheckMemoryPctHighWatermark - check memory high water mark
func (ns *Namespace) CheckMemoryPctHighWatermark(latestState common.Stats) {

	messages := common.Info{
		"yellow": "Used memory space for namespace <strong>%s on %s</strong> above high water mark",
		"green":  "Used memory space for namespace <strong>%s on %s</strong> below high water mark now",
	}

	usedMem := 100 - latestState.TryInt("free-pct-memory", 100)
	highWatermark := latestState.TryInt("high-water-memory-pct", 100)

	status := common.AlertStatusGreen
	if highWatermark > 0 && usedMem > highWatermark {
		status = common.AlertStatusYellow
	}

	alert := common.Alert{
		Id:          time.Now().UnixNano(),
		ClusterId:   ns.node.cluster.ID(),
		Type:        common.AlertTypeNamespaceMemoryPctHighWatermark,
		NodeAddress: ns.node.Address(),
		Namespace:   common.ToNullString(ns.name),
		Desc:        fmt.Sprintf(messages[string(status)], ns.name, ns.node.Address()),
		Created:     time.Now(),
		LastOccured: time.Now(),
		Status:      status,
	}

	ns.node.alerts().Register(&alert)
	// ns.node.setAlertState(ns.name+".AvailablePct", string(status))
}
