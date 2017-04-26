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

const _userFields = "Username, Password, Roles, FullName, Notes"

type User struct {
	Username string
	Password []byte
	roles    string
	Roles    []string
	FullName sql.NullString
	Notes    sql.NullString
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

	row := db.QueryRow(fmt.Sprintf("SELECT %s FROM users where Username = ?1", _userFields), username, hash)
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

func (u *User) fromSQLRow(row *sql.Row) error {
	if err := row.Scan(&u.Username, &u.Password, &u.roles, &u.FullName, &u.Notes); err != nil {
		return err
	}

	u.Roles = strings.Split(u.roles, ",")
	return nil
}
