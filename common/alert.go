package common

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
	// "github.com/sasha-s/go-sync"
	// "github.com/satori/go.uuID"
	// "github.com/jmoiron/sqlx"
)

const _alertFields = "Id, Type, ClusterId, NodeAddress, Namespace, Description, Created, LastOccured, Resolved, Recurrence, Status"

// AlertType - type
type AlertType int

// Alert Types
const (
	AlertTypeNodeStatus          AlertType = 0
	AlertTypeNodeVisibility      AlertType = 1
	AlertTypeNodeDisk            AlertType = 2
	AlertTypeNodeMemory          AlertType = 3
	AlertTypeNodeTransQueue      AlertType = 4
	AlertTypeNodeFileDescriptors AlertType = 5

	AlertTypeNamespaceAvailablePct           AlertType = 6
	AlertTypeNamespaceDiskPctHighWatermark   AlertType = 7
	AlertTypeNamespaceDiskPctStopWrites      AlertType = 8
	AlertTypeNamespaceMemoryPctHighWatermark AlertType = 9
	AlertTypeNamespaceMemoryPctStopWrites    AlertType = 10
)

// AlertStatus - type
type AlertStatus string

// Alert colors
const (
	AlertStatusRed    AlertStatus = "red"
	AlertStatusYellow AlertStatus = "yellow"
	AlertStatusGreen  AlertStatus = "green"
)

// Alert structure
type Alert struct {
	ID          int64
	Type        AlertType
	ClusterID   string
	NodeAddress string
	Namespace   sql.NullString
	Desc        string
	Created     time.Time
	LastOccured time.Time
	Resolved    NullTime
	Recurrence  int64
	Status      AlertStatus
}

var _dbGlobalMutex sync.RWMutex

// AlertBucket structure
type AlertBucket struct {
	alertQueue []*Alert
	pos        int

	// Alerts which should be sent for notification system
	newAlerts []*Alert

	mutex sync.RWMutex
}

// AlertsByID implements sort.Interface for []*Alert based on
// the Age field.
type AlertsByID []*Alert

func (a AlertsByID) Len() int           { return len(a) }
func (a AlertsByID) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a AlertsByID) Less(i, j int) bool { return a[i].ID < a[j].ID }

// NewAlertBucket - new alert bucket
func NewAlertBucket(size int) *AlertBucket {
	return &AlertBucket{
		alertQueue: make([]*Alert, size),
	}
}

// DrainNewAlerts - frain the news alerts
func (ad *AlertBucket) DrainNewAlerts() []*Alert {
	ad.mutex.Lock()
	defer ad.mutex.Unlock()

	res := make([]*Alert, len(ad.newAlerts))
	if len(ad.newAlerts) > 0 {
		copy(res, ad.newAlerts)
		ad.newAlerts = ad.newAlerts[:0]
	}

	return res
}

// Recurring - recurring alert
func (ad *AlertBucket) Recurring(alert *Alert) *Alert {
	ad.mutex.Lock()
	defer ad.mutex.Unlock()

	latest := Alert{}
	row := db.QueryRow(fmt.Sprintf("SELECT %s FROM alerts where Type = ?1 AND NodeAddress = ?2 AND Resolved IS NULL AND (Namespace IS NULL OR Namespace = ?3) ORDER BY Id DESC LIMIT 1", _alertFields), alert.Type, alert.NodeAddress, alert.Namespace.String)
	if err := latest.fromSQLRow(row); err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		log.Errorf("Error retrieving alert from the database: %s", err.Error())
	}

	if !latest.Resolved.Valid() {
		return &latest
	}

	return nil
}

// Register - register alert
func (ad *AlertBucket) Register(alert *Alert) (recurring bool) {
	if recurrAlert := ad.Recurring(alert); recurrAlert != nil {
		if alert.Status == AlertStatusGreen && recurrAlert.Status != AlertStatusGreen {
			// Recurring issue which is resolved
			ad.ResolveAlert(recurrAlert)
		} else {
			// The issue is recurring
			ad.updateRecurrence(recurrAlert)
			return true
		}
	} else if alert.Status == AlertStatusGreen {
		// do not save green alerts which do not resolve another alert
		return false
	}

	ad.saveAlert(alert)

	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()
	ad.newAlerts = append(ad.newAlerts, alert)

	return false
}

func (ad *AlertBucket) saveAlert(alert *Alert) {
	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()

	if alert.Created.IsZero() {
		alert.Created = time.Now()
	}

	if alert.LastOccured.IsZero() {
		alert.LastOccured = time.Now()
	}

	if ad.alertQueue == nil {
		ad.alertQueue = make([]*Alert, 50)
	}

	if alert.Status == AlertStatusGreen && !alert.Resolved.Valid() {
		alert.Resolved.Set(time.Now())
	}

	ad.alertQueue[ad.pos%len(ad.alertQueue)] = alert
	ad.pos++

	tx, err := db.Begin()
	if err != nil {
		log.Error(err)
		return
	}

	if _, err := tx.Exec(fmt.Sprintf("INSERT INTO alerts (%s) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)", _alertFields), alert.ID, alert.Type, alert.ClusterID, alert.NodeAddress, alert.Namespace, alert.Desc, alert.Created, alert.LastOccured, alert.Resolved, alert.Recurrence, string(alert.Status)); err != nil {
		log.Errorf("Error registering the alert in the DB: %s", err.Error())
	}

	if err = tx.Commit(); err != nil {
		log.Error(err)
	}
}

func (ad *AlertBucket) updateRecurrence(alert *Alert) {
	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()

	alert.LastOccured = time.Now()
	alert.Recurrence++

	tx, err := db.Begin()
	if err != nil {
		log.Error(err)
		return
	}

	if _, err := tx.Exec("UPDATE alerts SET Recurrence = Recurrence + 1, LastOccured = ?1 WHERE ID = ?2", alert.LastOccured, alert.ID); err != nil {
		log.Errorf("Error registering the alert in the DB: %s", err.Error())
	}

	if err = tx.Commit(); err != nil {
		log.Error(err)
	}
}

// ResolveAlert - clear alert
func (ad *AlertBucket) ResolveAlert(alert *Alert) {
	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()

	// Mark the old alert resolved
	alert.Resolved.Set(time.Now())

	// Mark the old alert resolved in the DB
	// Resolve all older alerts
	log.Warn("Marking the issue as resolved...")

	tx, err := db.Begin()
	if err != nil {
		log.Error(err.Error())
		return
	}

	if alert.Namespace.String == "" {
		if _, err := tx.Exec("UPDATE alerts SET Resolved=?1 WHERE Resolved IS NULL and Type = ?2 AND NodeAddress = ?3", alert.Resolved, alert.Type, alert.NodeAddress); err != nil {
			log.Error(err.Error())
		}
	} else {
		if _, err := tx.Exec("UPDATE alerts SET Resolved=?1 WHERE Resolved IS NULL and Type = ?2 AND NodeAddress = ?3 AND Namespace = ?4", alert.Resolved, alert.Type, alert.NodeAddress, alert.Namespace.String); err != nil {
			log.Error(err.Error())
		}
	}

	if err = tx.Commit(); err != nil {
		log.Error(err.Error())
	}
}

// AlertsFrom - get alert from table
func (ad *AlertBucket) AlertsFrom(nodeAddress string, id int64) []*Alert {
	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()

	res := []*Alert{}
	var rows *sql.Rows
	var err error

	if id == 0 {
		rows, err = db.Query(fmt.Sprintf("SELECT %s FROM alerts where NodeAddress = ?1 ORDER BY Id DESC LIMIT 20", _alertFields), nodeAddress)
	} else {
		rows, err = db.Query(fmt.Sprintf("SELECT %s FROM alerts where Id > ?1 AND NodeAddress = ?2 ORDER BY Id DESC LIMIT 1000", _alertFields), id, nodeAddress)
	}

	if err != nil {
		log.Errorf("Error retrieving alerts from the database: %s", err.Error())
		return res
	}

	defer rows.Close()
	res, err = fromSQLRows(rows)
	if err != nil {
		log.Errorf("Error retrieving alerts from the database: %s", err.Error())
	}

	return res
}

// RedAlertsFrom - get red alerts
func (ad *AlertBucket) RedAlertsFrom(nodeAddress string, ID int64) int {
	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()

	row := db.QueryRow("SELECT count(*) FROM alerts where Id > ?1 AND NodeAddress = ?2 AND Status = ?3 AND Resolved IS NULL", ID, nodeAddress, "red")

	var count int
	if err := row.Scan(&count); err != nil {
		log.Errorf("Error retrieving red alert count from the database: %s", err.Error())
		return 0
	}

	return count
}

func (a *Alert) fromSQLRow(row *sql.Row) error {
	return row.Scan(&a.ID, &a.Type, &a.ClusterID, &a.NodeAddress, &a.Namespace, &a.Desc, &a.Created, &a.LastOccured, &a.Resolved, &a.Recurrence, &a.Status)
}

func fromSQLRows(rows *sql.Rows) ([]*Alert, error) {
	res := []*Alert{}
	for rows.Next() {
		alert := Alert{}
		if err := rows.Scan(&alert.ID, &alert.Type, &alert.ClusterID, &alert.NodeAddress, &alert.Namespace, &alert.Desc, &alert.Created, &alert.LastOccured, &alert.Resolved, &alert.Recurrence, &alert.Status); err != nil {
			return res, err
		}
		res = append(res, &alert)
	}

	return res, nil
}

// Scan implements the Scanner interface.
func (nt *AlertStatus) Scan(value interface{}) error {
	*nt = AlertStatus(value.([]byte))
	return nil
}

// Value implements the driver Valuer interface.
func (nt AlertStatus) Value() (driver.Value, error) {
	return string(nt), nil
}
