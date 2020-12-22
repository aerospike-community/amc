package common

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strconv"
	"strings"
	"time"

	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"
)

var (
	_backupFields = [...]string{
		"Type",
		"Id",
		"ClusterId",
		"Namespace",
		"DestinationAddress",
		"Username",
		"DestinationPath",
		"Sets",
		"MetadataOnly",
		"TerminateOnClusterChange",
		"ScanPriority",
		"Created",
		"Finished",
		"Status",
		"ModifiedBefore",
		"ModifiedAfter",
	}
)

// BackupRestoreType type
type BackupRestoreType string

// BackupRestoreType
const (
	BackupRestoreTypeBackup  BackupRestoreType = "backup"
	BackupRestoreTypeRestore BackupRestoreType = "restore"
)

// BackupRestoreStatus type
type BackupRestoreStatus string

// BackupRestoreStatus
const (
	BackupStatusInProgress BackupRestoreStatus = "In Progress"
	BackupStatusFailed     BackupRestoreStatus = "Failure"
	BackupStatusFinished   BackupRestoreStatus = "Success"
)

// BackupRestore struct
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

	ModifiedBefore string
	ModifiedAfter  string

	Progress int
	Error    string

	SSHClient *SSHClient

	_persisted bool
}

// NewBackupRestore - Create new backup/restore
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
	ModifiedBefore string,
	ModifiedAfter string,
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

		ModifiedBefore: ModifiedBefore,
		ModifiedAfter:  ModifiedAfter,

		Status: Status,

		_persisted: false,
	}
}

// Save - save backup
func (br *BackupRestore) Save() error {
	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()

	if br.Created.IsZero() {
		br.Created = time.Now()
	}

	tx, err := db.Begin()
	if err != nil {
		log.Error(err)
		return err
	}

	if !br._persisted {
		if _, err := tx.Exec(
			fmt.Sprintf("INSERT INTO backups (%s) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)", strings.Join(_backupFields[:], ", ")),
			string(br.Type), br.Id, br.ClusterId, br.Namespace, br.DestinationAddress, br.Username, br.DestinationPath, br.Sets, br.MetadataOnly, br.TerminateOnClusterChange, br.ScanPriority, br.Created, br.Finished, string(br.Status), br.ModifiedBefore, br.ModifiedAfter,
		); err != nil {
			log.Errorf("Error registering the %s in the DB: %s", br.Type, err.Error())
			return err
		}
	} else {
		fields := make([]string, 0, len(_backupFields)+1)
		for i, f := range _backupFields {
			fields = append(fields, fmt.Sprintf("%s = ?%d", f, i+1))
		}

		fields = append(fields, "WHERE Id = ?"+strconv.Itoa(len(fields)+1))

		if _, err := tx.Exec(
			fmt.Sprintf("UPDATE backups SET %s", strings.Join(fields, ", ")),
			string(br.Type), br.Id, br.ClusterId, br.Namespace, br.DestinationAddress, br.Username, br.DestinationPath, br.Sets, br.MetadataOnly, br.TerminateOnClusterChange, br.ScanPriority, br.Created, br.Finished, string(br.Status), br.ModifiedBefore, br.ModifiedAfter,
			string(br.Id),
		); err != nil {
			log.Errorf("Error registering the %s in the DB: %s", br.Type, err.Error())
			return err
		}
	}

	if err = tx.Commit(); err != nil {
		log.Error(err)
		return err
	}

	return nil
}

// UpdateStatus - update status
func (br *BackupRestore) UpdateStatus(status BackupRestoreStatus) error {
	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()

	br.Status = status
	if status != BackupStatusInProgress {
		br.Finished.Set(time.Now())
	}

	tx, err := db.Begin()
	if err != nil {
		log.Error(err)
		return err
	}

	if _, err := tx.Exec(
		"UPDATE backups SET Status = ?1, Finished = ?2 WHERE Id = ?3", string(br.Status), br.Finished, br.Id); err != nil {
		log.Errorf("Error updating status of %s in the DB: %s", br.Type, err.Error())
		return err
	}

	if err = tx.Commit(); err != nil {
		log.Error(err)
		return err
	}

	return nil
}

// UpdateProgress - update progrss
func (br *BackupRestore) UpdateProgress(percent int) error {
	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()

	br.Progress = percent

	tx, err := db.Begin()
	if err != nil {
		log.Error(err)
		return err
	}

	if _, err := tx.Exec(
		"UPDATE backups SET Progress = ?1 WHERE Id = ?2", percent, br.Id); err != nil {
		log.Errorf("Error updating progress of %s in the DB: %s", br.Type, err.Error())
		return err
	}

	if err = tx.Commit(); err != nil {
		log.Error(err)
		return err
	}
	return nil
}

// UpdateError - update on error
func (br *BackupRestore) UpdateError(errorMsg string) error {
	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()

	br.Error = errorMsg

	tx, err := db.Begin()
	if err != nil {
		log.Error(err)
		return err
	}

	if _, err := tx.Exec(
		"UPDATE backups SET Error = ?1 WHERE Id = ?2", errorMsg, br.Id); err != nil {
		log.Errorf("Error updating error message of %s in the DB: %s", br.Type, err.Error())
		return err
	}

	if err = tx.Commit(); err != nil {
		log.Error(err)
		return err

	}

	return nil
}

// SuccessfulBackups - return list of successful backups
func SuccessfulBackups() ([]*BackupRestore, error) {
	_dbGlobalMutex.Lock()
	defer _dbGlobalMutex.Unlock()

	rows, err := db.Query(fmt.Sprintf("SELECT %s FROM backups where Type = ?1 AND Status = ?2 ORDER BY Created DESC", strings.Join(_backupFields[:], ", ")), BackupRestoreTypeBackup, BackupStatusFinished)
	if err != nil {
		log.Errorf("Error Querying Backups in the DB: %s", err.Error())
		return nil, err
	}

	return backupRestoreFromSQLRows(rows)
}

// func (br *BackupRestore) fromSQLRow(row *sql.Row) error {
// 	return row.Scan(&br.Type, &br.Id, &br.ClusterId, &br.Namespace, &br.DestinationAddress, &br.Username, &br.DestinationPath, &br.Sets, &br.MetadataOnly, &br.TerminateOnClusterChange, &br.ScanPriority, &br.Created, &br.Finished, &br.Status)
// }

func backupRestoreFromSQLRows(rows *sql.Rows) ([]*BackupRestore, error) {
	res := []*BackupRestore{}
	for rows.Next() {
		br := BackupRestore{_persisted: true}
		if err := rows.Scan(&br.Type, &br.Id, &br.ClusterId, &br.Namespace, &br.DestinationAddress, &br.Username, &br.DestinationPath, &br.Sets, &br.MetadataOnly, &br.TerminateOnClusterChange, &br.ScanPriority, &br.Created, &br.Finished, &br.Status, &br.ModifiedBefore, &br.ModifiedAfter); err != nil {
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
