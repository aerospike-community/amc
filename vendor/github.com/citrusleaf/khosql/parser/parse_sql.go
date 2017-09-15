// Copyright 2013-2015 Khosrow Afroozeh.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package aql

import (
	"database/sql/driver"
	"fmt"

	as "github.com/aerospike/aerospike-client-go"
)

type SQLStatement interface {
	Execute(chan *as.Result) error
	PostExecute()

	Validate() error
	RecordsAffected() int64
	ApplyDriverValueArguments(...driver.Value) error
	NumVars() int
}

type HasHeader interface {
	FieldList() []string
}

/*
	Policies
*/

var SelectReadPolicy = as.NewPolicy()
var SelectQueryPolicy = as.NewQueryPolicy()

var InsertPolicy = &as.WritePolicy{BasePolicy: *as.NewPolicy(), RecordExistsAction: as.CREATE_ONLY}
var UpdatePolicy = &as.WritePolicy{BasePolicy: *as.NewPolicy(), RecordExistsAction: as.UPDATE_ONLY}
var DeletePolicy = &as.WritePolicy{BasePolicy: *as.NewPolicy()}

// var Client *as.Client

func (p *AQLParser) WriteString(sql string) error {
	_, err := p.rw.WriteString(sql)
	return err
}

func (p *AQLParser) Reset() error {
	p.rw.Reset()
	p.buf = parserBuffer{}
	return nil
}

// Parse parses a SQL SELECT statement.
func (p *AQLParser) ParseSQL() (stmt SQLStatement, err error) {

	// Find out what type of command to run
	tok, lit := p.nextToken()
	p.unscan()

	switch tok {

	case EXPLAIN:
		stmt, err = p.ParseExplain()

	case SELECT:
		stmt, err = p.ParseSelect()

	case INSERT:
		stmt, err = p.ParseInsert()

	case UPDATE:
		stmt, err = p.ParseUpdate()

	case DELETE:
		stmt, err = p.ParseDelete()

	case SHOW:
		stmt, err = p.ParseShow()

	case HELP:
		stmt, err = p.ParseHelp()

	case EXIT:
		stmt, err = p.ParseExit()
	default:
		stmt, err = nil, fmt.Errorf("ERROR: 404: COMMAND NOT FOUND : `%s`", lit)
	}

	// if err != nil {
	// 	ch <- &as.Result{Err: err}
	// 	return err
	// }

	// if stmt != nil {
	// 	stmt.Execute(ch)
	// } else {
	// 	ch <- &as.Result{Err: fmt.Errorf("ERROR: 404: COMMAND NOT FOUND : %s", lit)}
	// }

	return stmt, err
}

/*
	Helper Functions
*/
func (p *AQLParser) ParseNamespaceAndSet() (ns, set string, err error) {
	// Finally we should read the table name.
	tok, lit := p.nextToken()
	if tok != IDENT {
		p.unscan()
		return "", "", fmt.Errorf("found %q, expected namespace name", lit)
	}
	ns = lit

	// read the dot
	tok, lit = p.scan()
	if tok != DOT {
		p.unscan()
		return ns, set, nil
	}

	// read set name
	tok, lit = p.scanNextAsIdent()
	if tok != IDENT {
		p.unscan()
		return "", "", fmt.Errorf("found %q, expected set name instead", lit)
	}
	set = lit

	return ns, set, nil
}
