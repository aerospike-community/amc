package models

import (
	"crypto/subtle"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	log "github.com/Sirupsen/logrus"

	"github.com/citrusleaf/amc/common"
)

const _userFields = "Username, Password, Roles, FullName, Notes, Active"

type UserRole string

const (
	URAdmin UserRole = "admin"
	URDev   UserRole = "dev"
	UROps   UserRole = "ops"
)

type User struct {
	Username string
	Password []byte
	roles    string
	Roles    []string
	FullName sql.NullString
	Notes    sql.NullString
	Active   bool
	oldUser  bool
}

func LoginUser(username, password string) (*User, error) {
	db := common.DB()

	db.Lock()
	defer db.Unlock()

	res := new(User)

	hash, err := common.HashPassword(password)
	if err != nil {
		return nil, err
	}

	row := db.QueryRow(fmt.Sprintf("SELECT %s FROM users WHERE Username = ?1", _userFields), username, hash)
	if err != nil {
		log.Errorf("Error retrieving alerts from the database: %s", err.Error())
		return nil, err
	}

	err = res.fromSQLRow(row)
	if err != nil {
		log.Errorf("Error retrieving User from the database: %s", err.Error())
		return nil, err
	}

	if subtle.ConstantTimeCompare(hash, res.Password) != 1 {
		return nil, errors.New("Wrong Password.")
	}

	res.Password = nil
	return res, nil
}

func QueryUsers() ([]*User, error) {
	db := common.DB()

	db.Lock()
	defer db.Unlock()

	rows, err := db.Query(fmt.Sprintf("SELECT %s FROM users", _userFields))
	if err != nil {
		log.Errorf("Error retrieving users from the database: %s", err.Error())
		return nil, err
	}

	defer rows.Close()
	users, err := usersFromSQLRows(rows)
	if err != nil {
		log.Errorf("Error retrieving Users from the database: %s", err.Error())
		return nil, err
	}

	return users, nil
}

func GetUser(username string) (*User, error) {
	db := common.DB()

	db.Lock()
	defer db.Unlock()

	row := db.QueryRow(fmt.Sprintf("SELECT %s FROM users WHERE Username = ?1", _userFields), username)

	res := new(User)
	err := res.fromSQLRow(row)
	if err != nil {
		log.Errorf("Error retrieving User from the database: %s", err.Error())
		return nil, err
	}

	return res, nil
}

func (u *User) SetPassword(password string) error {
	hash, err := common.HashPassword(password)
	if err != nil {
		return err
	}

	u.Password = hash
	return nil
}

func (u *User) Validate() error {
	if len(u.Password) != 20 {
		return errors.New("Invalid Password.")
	}
	if len(u.Username) == 0 {
		return errors.New("Invalid Username.")
	}
	if len(u.Roles) == 0 {
		return errors.New("Invalid Roles.")
	}
	return nil
}

func (u *User) HasRole(role UserRole) bool {
	for i := range u.Roles {
		if string(role) == u.Roles[i] {
			return true
		}
	}
	return false
}

func (u *User) Delete() error {
	if strings.ToLower(strings.Trim(u.Username, " \t")) == "admin" {
		return errors.New("Cannot delete `admin`.")
	}

	db := common.DB()
	db.Lock()
	defer db.Unlock()

	tx, err := db.Begin()
	if err != nil {
		log.Error(err.Error())
		return err
	}

	if _, err := tx.Exec("DELETE FROM users WHERE Username = ?1", u.Username); err != nil {
		log.Error(err.Error())
	}

	if err = tx.Commit(); err != nil {
		log.Error(err.Error())
		return err
	}

	return nil
}

func (u *User) Save() error {
	if err := u.Validate(); err != nil {
		return err
	}

	db := common.DB()
	db.Lock()
	defer db.Unlock()

	tx, err := db.Begin()
	if err != nil {
		log.Error(err.Error())
		return err
	}

	if !u.oldUser {
		if _, err := tx.Exec(fmt.Sprintf("INSERT INTO users (%s) VALUES (?1, ?2, ?3, ?4, ?5)", _userFields), u.Username, u.Password, strings.Join(u.Roles, ","), u.FullName, u.Notes, u.Active); err != nil {
			log.Error(err.Error())
		}
	} else {
		if len(u.Password) == 0 {
			if _, err := tx.Exec("UPDATE users SET Roles=?2, Fullname=?3, Notes=?4 WHERE Username = ?5", strings.Join(u.Roles, ","), u.FullName, u.Notes, u.Username, u.Active); err != nil {
				log.Error(err.Error())
			}
		} else {
			if _, err := tx.Exec("UPDATE users SET Password=?1, Roles=?2, Fullname=?3, Notes=?4 WHERE Username = ?5", u.Password, strings.Join(u.Roles, ","), u.FullName, u.Notes, u.Username, u.Active); err != nil {
				log.Error(err.Error())
			}
		}
	}

	if err = tx.Commit(); err != nil {
		log.Error(err.Error())
		return err
	}

	return nil
}

func (u *User) fromSQLRow(row *sql.Row) error {
	if err := row.Scan(&u.Username, &u.Password, &u.roles, &u.FullName, &u.Notes, &u.Active); err != nil {
		return err
	}

	u.Roles = strings.Split(u.roles, ",")
	u.oldUser = true
	return nil
}

func usersFromSQLRows(rows *sql.Rows) ([]*User, error) {
	res := []*User{}
	for rows.Next() {
		u := new(User)
		if err := rows.Scan(&u.Username, &u.Password, &u.roles, &u.FullName, &u.Notes, &u.Active); err != nil {
			return nil, err
		}
		u.oldUser = true
		res = append(res, u)
	}

	return res, nil
}
