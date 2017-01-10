package common

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"time"

	log "github.com/Sirupsen/logrus"
	"github.com/satori/go.uuid"
)

const (
	_backupFields = "Type, Id, ClusterId, Namespace, DestinationAddress, Username, DestinationPath, Sets, MetadataOnly, TerminateOnClusterChange, ScanPriority, Created, Finished, Status"
)

type BackupRestoreType string

const (
	BackupRestoreTypeBackup  BackupRestoreType = "backup"
	BackupRestoreTypeRestore BackupRestoreType = "restore"
)

type BackupRestoreStatus string

const (
	BackupStatusInProgress BackupRestoreStatus = "In Progress"
	BackupStatusFailed     BackupRestoreStatus = "Failure"
	BackupStatusFinished   BackupRestoreStatus = "Success"
)

type BackupRestore struct {
	Type      BackupRestoreType
	Id        string
	ClusterId string

	Namespace                string
	DestinationAddress       string
	Username                 string
	Password                 string
	DestinationPath          string
	Sets                     sql.NullString
	MetadataOnly             bool
	TerminateOnClusterChange bool
	ScanPriority             int
	Created                  time.Time
	Finished                 NullTime
	Status                   BackupRestoreStatus

	Progress int
	Error    string

	SSHClient *SSHClient
}

func NewBackupRestore(
	Type BackupRestoreType,
	ClusterId string,
	Namespace string,
	DestinationAddress string,
	Username string,
	Password string,
	DestinationPath string,
	Sets string,
	MetadataOnly bool,
	TerminateOnClusterChange bool,
	ScanPriority int,
	Status BackupRestoreStatus) *BackupRestore {

	return &BackupRestore{
		Type:      Type,
		Id:        uuid.NewV4().String(),
		ClusterId: ClusterId,

		Namespace:                Namespace,
		DestinationAddress:       DestinationAddress,
		Username:                 Username,
		Password:                 Password,
		DestinationPath:          DestinationPath,
		Sets:                     sql.NullString{String: Sets, Valid: len(Sets) > 0},
		MetadataOnly:             MetadataOnly,
		TerminateOnClusterChange: TerminateOnClusterChange,
		ScanPriority:             ScanPriority,
		Created:                  time.Now(),
		Status:                   Status,
	}
}

func (br *BackupRestore) Save() error {
	if br.Created.IsZero() {
		br.Created = time.Now()
	}

	if _, err := db.Exec(
		fmt.Sprintf("INSERT OR REPLACE INTO backups (%s) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", _backupFields),
		string(br.Type), br.Id, br.ClusterId, br.Namespace, br.DestinationAddress, br.Username, br.DestinationPath, br.Sets, br.MetadataOnly, br.TerminateOnClusterChange, br.ScanPriority, br.Created, br.Finished, string(br.Status),
	); err != nil {
		log.Errorf("Error registering the %s in the DB: %s", br.Type, err.Error())
		return err
	}

	return nil
}

func (br *BackupRestore) UpdateStatus(status BackupRestoreStatus) error {
	br.Status = status
	if status != BackupStatusInProgress {
		br.Finished.Set(time.Now())
	}

	if _, err := db.Exec(
		"UPDATE backups SET Status = ?, Finished = ? WHERE ID = ?", string(br.Status), br.Finished, br.Id); err != nil {
		log.Errorf("Error updating status of %s in the DB: %s", br.Type, err.Error())
		return err
	}

	return nil
}

func (br *BackupRestore) UpdateProgress(percent int) error {
	br.Progress = percent

	if _, err := db.Exec(
		"UPDATE backups SET Progress = ? WHERE ID = ?", percent, br.Id); err != nil {
		log.Errorf("Error updating progress of %s in the DB: %s", br.Type, err.Error())
		return err
	}

	return nil
}

func (br *BackupRestore) UpdateError(errorMsg string) error {
	br.Error = errorMsg

	if _, err := db.Exec(
		"UPDATE backups SET Error = ? WHERE ID = ?", errorMsg, br.Id); err != nil {
		log.Errorf("Error updating error message of %s in the DB: %s", br.Type, err.Error())
		return err
	}

	return nil
}

func SuccessfulBackups() ([]*BackupRestore, error) {
	rows, err := db.Query(fmt.Sprintf("SELECT %s FROM backups where Type = ? AND Status = ? ORDER BY Created DESC", _backupFields), BackupRestoreTypeBackup, BackupStatusFinished)
	if err != nil {
		log.Errorf("Error Querying Backups in the DB: %s", err.Error())
		return nil, err
	}

	return backupRestoreFromSQLRows(rows)
}

func (br *BackupRestore) fromSQLRow(row *sql.Row) error {
	return row.Scan(&br.Type, &br.Id, &br.ClusterId, &br.Namespace, &br.DestinationAddress, &br.Username, &br.DestinationPath, &br.Sets, &br.MetadataOnly, &br.TerminateOnClusterChange, &br.ScanPriority, &br.Created, &br.Finished, &br.Status)
}

func backupRestoreFromSQLRows(rows *sql.Rows) ([]*BackupRestore, error) {
	res := []*BackupRestore{}
	for rows.Next() {
		br := BackupRestore{}
		if err := rows.Scan(&br.Type, &br.Id, &br.ClusterId, &br.Namespace, &br.DestinationAddress, &br.Username, &br.DestinationPath, &br.Sets, &br.MetadataOnly, &br.TerminateOnClusterChange, &br.ScanPriority, &br.Created, &br.Finished, &br.Status); err != nil {
			return res, err
		}
		res = append(res, &br)
	}

	return res, nil
}

// Scan implements the Scanner interface.
func (nt *BackupRestoreStatus) Scan(value interface{}) error {
	*nt = BackupRestoreStatus(value.([]byte))
	return nil
}

// Value implements the driver Valuer interface.
func (nt BackupRestoreStatus) Value() (driver.Value, error) {
	return string(nt), nil
}

// Scan implements the Scanner interface.
func (nt *BackupRestoreType) Scan(value interface{}) error {
	*nt = BackupRestoreType(value.([]byte))
	return nil
}

// Value implements the driver Valuer interface.
func (nt BackupRestoreType) Value() (driver.Value, error) {
	return string(nt), nil
}
