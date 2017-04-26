package models

import (
	"database/sql"
	"fmt"

	log "github.com/Sirupsen/logrus"
	"github.com/satori/go.uuid"

	"github.com/citrusleaf/amc/common"
)

const _connectionFields = "Id, Username, Label, Seeds"

type Connection struct {
	Id       string
	Username string
	Label    string
	Seeds    string
}

func QueryUserConnections(username string) ([]*Connection, error) {
	db := common.DB()

	db.Lock()
	defer db.Unlock()

	rows, err := db.Query(fmt.Sprintf("SELECT %s FROM connections where Username = ?1", _connectionFields), username)
	if err != nil {
		log.Errorf("Error retrieving connections from the database: %s", err.Error())
		return nil, err
	}

	defer rows.Close()
	conns, err := connectionsFromSQLRows(rows)
	if err != nil {
		log.Errorf("Error retrieving Connections from the database: %s", err.Error())
		return nil, err
	}

	return conns, nil
}

func GetConnection(username, label string) (*Connection, error) {
	db := common.DB()

	db.Lock()
	defer db.Unlock()

	row := db.QueryRow(fmt.Sprintf("SELECT %s FROM connections WHERE Username = ?1 AND Label = ?2", _connectionFields), username, label)

	res := new(Connection)
	err := res.fromSQLRow(row)
	if err != nil {
		log.Errorf("Error retrieving Connection from the database: %s", err.Error())
		return nil, err
	}

	return res, nil
}

func (c *Connection) Delete() error {
	db := common.DB()
	db.Lock()
	defer db.Unlock()

	tx, err := db.Begin()
	if err != nil {
		log.Error(err.Error())
		return err
	}

	if _, err := tx.Exec("DELETE FROM connections WHERE Id = ?1", c.Id); err != nil {
		log.Error(err.Error())
	}

	if err = tx.Commit(); err != nil {
		log.Error(err.Error())
		return err
	}

	return nil
}

func (c *Connection) Save() error {
	db := common.DB()
	db.Lock()
	defer db.Unlock()

	tx, err := db.Begin()
	if err != nil {
		log.Error(err.Error())
		return err
	}

	if len(c.Id) == 0 {
		if _, err := tx.Exec(fmt.Sprintf("INSERT INTO connections (%s) VALUES (?1, ?2, ?3, ?4)", _connectionFields), uuid.NewV4().String(), c.Username, c.Label, c.Seeds); err != nil {
			log.Error(err.Error())
		}
	} else {
		if _, err := tx.Exec("UPDATE connections SET Username = ?1, Label=?2, Seeds=?3 WHERE Id = ?4", c.Username, c.Label, c.Seeds, c.Id); err != nil {
			log.Error(err.Error())
		}
	}

	if err = tx.Commit(); err != nil {
		log.Error(err.Error())
		return err
	}

	return nil
}

func (c *Connection) fromSQLRow(row *sql.Row) error {
	return row.Scan(&c.Id, &c.Username, &c.Label, &c.Seeds)
}

func connectionsFromSQLRows(rows *sql.Rows) ([]*Connection, error) {
	res := []*Connection{}
	for rows.Next() {
		c := new(Connection)
		if err := rows.Scan(&c.Id, &c.Username, &c.Label, &c.Seeds); err != nil {
			return nil, err
		}
		res = append(res, c)
	}

	return res, nil
}
