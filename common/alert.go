package common

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"sync"
	"time"

	log "github.com/Sirupsen/logrus"
	// "github.com/satori/go.uuid"
	// "github.com/jmoiron/sqlx"
)

const _alertFields = "Id, Type, ClusterId, NodeAddress, Desc, Created, LastOccured, Resolved, Recurrence, Status"

type AlertType int

const (
	AlertTypeNodeStatus          AlertType = 0
	AlertTypeNodeVisibility      AlertType = 1
	AlertTypeNodeDisk            AlertType = 2
	AlertTypeNodeMemory          AlertType = 3
	AlertTypeNodeTransQueue      AlertType = 4
	AlertTypeNodeFileDescriptors AlertType = 5
)

type AlertStatus string

const (
	AlertStatusRed    AlertStatus = "red"
	AlertStatusYellow AlertStatus = "yellow"
	AlertStatusGreen  AlertStatus = "green"
)

type Alert struct {
	Id          int64
	Type        AlertType
	ClusterId   string
	NodeAddress string
	Desc        string
	Created     time.Time
	LastOccured time.Time
	Resolved    NullTime
	Recurrence  int
	Status      AlertStatus
}

type AlertBucket struct {
	db *sql.DB

	alertQueue []*Alert
	pos        int
	mutex      sync.RWMutex
}

// AlertsById implements sort.Interface for []*Alert based on
// the Age field.
type AlertsById []*Alert

func (a AlertsById) Len() int           { return len(a) }
func (a AlertsById) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a AlertsById) Less(i, j int) bool { return a[i].Id < a[j].Id }

func NewAlertBucket(db *sql.DB, size int) *AlertBucket {
	return &AlertBucket{
		db:         db,
		alertQueue: make([]*Alert, size),
	}
}

func (ad *AlertBucket) Recurring(alert *Alert) *Alert {
	ad.mutex.RLock()
	defer ad.mutex.RUnlock()

	if ad.db == nil {
		for _, a := range ad.alertQueue {
			if a.Type == alert.Type &&
				a.Status == alert.Status &&
				a.NodeAddress == alert.NodeAddress &&
				!a.Resolved.Valid() {
				return a
			}
		}
	} else {
		latest := Alert{}
		row := ad.db.QueryRow(fmt.Sprintf("SELECT %s FROM alerts where Type = ? AND NodeAddress = ? And Resolved IS NULL ORDER BY Id DESC LIMIT 1", _alertFields), alert.Type, alert.NodeAddress)
		if err := latest.fromSQLRow(row); err != nil {
			if err == sql.ErrNoRows {
				return nil
			}
			log.Errorf("Error retrieving alert from the database: %s", err.Error())
		}

		if !latest.Resolved.Valid() {
			return &latest
		}
	}

	return nil
}

func (ad *AlertBucket) Register(alert *Alert) {
	if recurrAlert := ad.Recurring(alert); recurrAlert != nil {
		log.Warnf("The issue is recurring...", recurrAlert)
		if alert.Status == AlertStatusGreen && recurrAlert.Status != AlertStatusGreen {
			log.Warn("The issue is resolved...")
			ad.ResolveAlert(recurrAlert)
			ad.saveAlert(alert)
		} else {
			ad.updateRecurrence(recurrAlert)
		}
		return
	}

	ad.saveAlert(alert)
}

func (ad *AlertBucket) saveAlert(alert *Alert) {
	ad.mutex.Lock()
	defer ad.mutex.Unlock()

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

	if ad.db != nil {
		if _, err := ad.db.Exec(fmt.Sprintf("INSERT INTO alerts (%s) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", _alertFields), alert.Id, alert.Type, alert.ClusterId, alert.NodeAddress, alert.Desc, alert.Created, alert.LastOccured, alert.Resolved, alert.Recurrence, string(alert.Status)); err != nil {
			log.Errorf("Error registering the alert in the DB: %s", err.Error())
		}
	}
}

func (ad *AlertBucket) updateRecurrence(alert *Alert) {
	ad.mutex.Lock()
	defer ad.mutex.Unlock()

	alert.LastOccured = time.Now()
	alert.Recurrence++
	if ad.db != nil {
		if _, err := ad.db.Exec("UPDATE alerts SET Recurrence = Recurrence + 1, LastOccured = ? WHERE Id = ?", alert.LastOccured, alert.Id); err != nil {
			log.Errorf("Error registering the alert in the DB: %s", err.Error())
		}
	}
}

func (ad *AlertBucket) ResolveAlert(alert *Alert) {
	// Mark the old alert resolved
	alert.Resolved.Set(time.Now())

	// Mark the old alert resolved in the DB
	if ad.db != nil {
		// Resolve all older alerts

		log.Warn("Marking the issue as resolved...")
		if _, err := ad.db.Exec("UPDATE alerts SET Resolved=? WHERE Resolved IS NULL and Type = ? AND NodeAddress = ?", alert.Resolved, alert.Type, alert.NodeAddress); err != nil {
			log.Error(err)
		}
	}
}

func (ad *AlertBucket) AlertsFrom(nodeAddress string, id int64) []*Alert {
	ad.mutex.RLock()
	defer ad.mutex.RUnlock()

	res := []*Alert{}
	if ad.db == nil {
		if ad.pos <= 0 {
			return res
		}

		begin := ad.pos - len(ad.alertQueue)
		if begin < 0 {
			begin = 0
		}

		for i := ad.pos - 1; i >= begin; i-- {
			alert := ad.alertQueue[i%len(ad.alertQueue)]
			if alert.Id > id {
				res = append(res, alert)
			}
		}
	} else {
		var rows *sql.Rows
		var err error

		if id == 0 {
			rows, err = ad.db.Query(fmt.Sprintf("SELECT %s FROM alerts where NodeAddress = ? ORDER BY Id DESC LIMIT 20", _alertFields), nodeAddress)
		} else {
			rows, err = ad.db.Query(fmt.Sprintf("SELECT %s FROM alerts where Id > ? AND NodeAddress = ? ORDER BY Id DESC", _alertFields), id, nodeAddress)
		}

		if err != nil {
			log.Errorf("Error retrieving alerts from the database: %s", err.Error())
			return res
		}

		res, err = fromSQLRows(rows)
		if err != nil {
			log.Errorf("Error retrieving alerts from the database: %s", err.Error())
		}
	}

	return res
}

func (a *Alert) fromSQLRow(row *sql.Row) error {
	return row.Scan(&a.Id, &a.Type, &a.ClusterId, &a.NodeAddress, &a.Desc, &a.Created, &a.LastOccured, &a.Resolved, &a.Recurrence, &a.Status)
}

func fromSQLRows(rows *sql.Rows) ([]*Alert, error) {
	res := []*Alert{}
	for rows.Next() {
		alert := Alert{}
		if err := rows.Scan(&alert.Id, &alert.Type, &alert.ClusterId, &alert.NodeAddress, &alert.Desc, &alert.Created, &alert.LastOccured, &alert.Resolved, &alert.Recurrence, &alert.Status); err != nil {
			return res, err
		}
		res = append(res, &alert)
	}

	return res, nil
}

type NullTime struct {
	time  time.Time
	valid bool // Valid is true if Time is not NULL
}

// Scan implements the Scanner interface.
func (nt *NullTime) Set(t time.Time) {
	nt.time = t
	nt.valid = true
}

// Scan implements the Scanner interface.
func (nt *NullTime) Valid() bool {
	return nt.valid
}

// Scan implements the Scanner interface.
func (nt *NullTime) Scan(value interface{}) error {
	nt.time, nt.valid = value.(time.Time)
	return nil
}

// Value implements the driver Valuer interface.
func (nt NullTime) Value() (driver.Value, error) {
	if !nt.valid {
		return nil, nil
	}
	return nt.time, nil
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
