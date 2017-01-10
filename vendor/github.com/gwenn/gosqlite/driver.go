// Copyright 2010 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package sqlite

import (
	"database/sql"
	"database/sql/driver"
	"errors"
	"io"
	"log"
	"os"
	"reflect"
	"time"
	"unsafe"
)

func init() {
	sql.Register("sqlite3", &impl{open: defaultOpen})
	if os.Getenv("SQLITE_LOG") != "" {
		ConfigLog(func(d interface{}, err error, msg string) {
			log.Printf("%s: %s, %s\n", d, err, msg)
		}, "SQLITE")
	}
	ConfigMemStatus(false)
}

// impl is an adapter to database/sql/driver
type impl struct {
	open      func(name string) (*Conn, error)
	configure func(*Conn) error
}
type conn struct {
	c *Conn
}
type stmt struct {
	s            *Stmt
	rowsRef      bool // true if there is a rowsImpl associated to this statement that has not been closed.
	pendingClose bool
}
type rowsImpl struct {
	s           *stmt
	columnNames []string // cache
}

type result struct {
	id   int64
	rows int64
}

func (r *result) LastInsertId() (int64, error) {
	return r.id, nil
}

func (r *result) RowsAffected() (int64, error) {
	return r.rows, nil
}

// NewDriver creates a new driver with specialized connection creation/configuration.
//   NewDriver(customOpen, nil) // no post-creation hook
//   NewDriver(nil, customConfigure) // default connection creation but specific configuration step
func NewDriver(open func(name string) (*Conn, error), configure func(*Conn) error) driver.Driver {
	if open == nil {
		open = defaultOpen
	}
	return &impl{open: open, configure: configure}
}

var defaultOpen = func(name string) (*Conn, error) {
	// OpenNoMutex == multi-thread mode (http://sqlite.org/compile.html#threadsafe and http://sqlite.org/threadsafe.html)
	c, err := Open(name, OpenUri, OpenNoMutex, OpenReadWrite, OpenCreate)
	if err != nil {
		return nil, err
	}
	c.BusyTimeout(10 * time.Second)
	//c.DefaultTimeLayout = "2006-01-02 15:04:05.999999999"
	c.ScanNumericalAsTime = true
	return c, nil
}

// Open opens a new database connection.
// ":memory:" for memory db,
// "" for temp file db
func (d *impl) Open(name string) (driver.Conn, error) {
	c, err := d.open(name)
	if err != nil {
		return nil, err
	}
	if d.configure != nil {
		if err = d.configure(c); err != nil {
			_ = c.Close()
			return nil, err
		}
	}
	return &conn{c}, nil
}

// Unwrap gives access to underlying driver connection.
func Unwrap(db *sql.DB) *Conn {
	_, err := db.Exec("unwrap")
	if cerr, ok := err.(ConnError); ok {
		return cerr.c
	}
	return nil
}

// PRAGMA schema_version may be used to detect when the database schema is altered

func (c *conn) Exec(query string, args []driver.Value) (driver.Result, error) {
	if c.c.IsClosed() {
		return nil, driver.ErrBadConn
	}
	if len(args) == 0 {
		if query == "unwrap" {
			return nil, ConnError{c: c.c}
		}
		if err := c.c.FastExec(query); err != nil {
			return nil, err
		}
		return c.c.result(), nil
	}
	// https://code.google.com/p/go-wiki/wiki/cgo#Turning_C_arrays_into_Go_slices
	var iargs []interface{}
	h := (*reflect.SliceHeader)(unsafe.Pointer(&iargs))
	h.Data = uintptr(unsafe.Pointer(&args[0]))
	h.Len = len(args)
	h.Cap = cap(args)
	if err := c.c.Exec(query, iargs...); err != nil {
		return nil, err
	}
	return c.c.result(), nil
}

func (c *conn) Prepare(query string) (driver.Stmt, error) {
	if c.c.IsClosed() {
		return nil, driver.ErrBadConn
	}
	s, err := c.c.Prepare(query)
	if err != nil {
		return nil, err
	}
	return &stmt{s: s}, nil
}

func (c *conn) Close() error {
	return c.c.Close()
}

func (c *conn) Begin() (driver.Tx, error) {
	if c.c.IsClosed() {
		return nil, driver.ErrBadConn
	}
	if err := c.c.Begin(); err != nil {
		return nil, err
	}
	return c, nil
}

func (c *conn) Commit() error {
	return c.c.Commit()
}
func (c *conn) Rollback() error {
	return c.c.Rollback()
}

func (s *stmt) Close() error {
	if s.rowsRef { // Currently, it never happens because the sql.Stmt doesn't call driver.Stmt in this case
		s.pendingClose = true
		return nil
	}
	return s.s.Finalize()
}

func (s *stmt) NumInput() int {
	return s.s.BindParameterCount()
}

func (s *stmt) Exec(args []driver.Value) (driver.Result, error) {
	if err := s.bind(args); err != nil {
		return nil, err
	}
	if err := s.s.exec(); err != nil {
		return nil, err
	}
	return s.s.c.result(), nil
}

func (s *stmt) Query(args []driver.Value) (driver.Rows, error) {
	if s.rowsRef {
		return nil, errors.New("previously returned Rows still not closed")
	}
	if err := s.bind(args); err != nil {
		return nil, err
	}
	s.rowsRef = true
	return &rowsImpl{s, nil}, nil
}

func (s *stmt) bind(args []driver.Value) error {
	for i, v := range args {
		if err := s.s.BindByIndex(i+1, v); err != nil {
			return err
		}
	}
	return nil
}

func (r *rowsImpl) Columns() []string {
	if r.columnNames == nil {
		r.columnNames = r.s.s.ColumnNames()
	}
	return r.columnNames
}

func (r *rowsImpl) Next(dest []driver.Value) error {
	ok, err := r.s.s.Next()
	if err != nil {
		return err
	}
	if !ok {
		return io.EOF
	}
	for i := range dest {
		dest[i], _ = r.s.s.ScanValue(i, true)
		/*if !driver.IsScanValue(dest[i]) {
			panic("Invalid type returned by ScanValue")
		}*/
	}
	return nil
}

func (r *rowsImpl) Close() error {
	r.s.rowsRef = false
	if r.s.pendingClose {
		return r.s.Close()
	}
	return r.s.s.Reset()
}

func (c *Conn) result() driver.Result {
	// TODO How to know that the last Stmt has done an INSERT? An authorizer?
	id := c.LastInsertRowid()
	// TODO How to know that the last Stmt has done a DELETE/INSERT/UPDATE? An authorizer?
	rows := int64(c.Changes())
	return &result{id, rows} // FIXME RowAffected/noRows
}
