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

type Explainable interface {
	SQLStatement

	Explain() []*as.Record
}

// ExplainStatement represents a SQL EXPLAIN statement.
type ExplainStatement struct {
	Subject Explainable
}

// Parse parses a SQL EXPLAIN statement.
func (p *AQLParser) ParseExplain() (stmt *ExplainStatement, err error) {
	stmt = &ExplainStatement{}

	// First token should be a "EXPLAIN" keyword.
	tok, lit := p.nextToken()
	if tok != EXPLAIN {
		return nil, fmt.Errorf("found %q, expected EXPLAIN", lit)
	}

	tok, lit = p.peekToken()
	switch tok {
	case SELECT:
		stmt.Subject, err = p.ParseSelect()
		if err != nil {
			return nil, err
		}
	case UPDATE:
		stmt.Subject, err = p.ParseUpdate()
		if err != nil {
			return nil, err
		}
	case DELETE:
		stmt.Subject, err = p.ParseDelete()
		if err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("EXPLAIN is not supported for command %q", lit)
	}

	return stmt, nil
}

func (stmt *ExplainStatement) PostExecute() {
}

func (stmt *ExplainStatement) FieldList() []string {
	return []string{"description"}
}

// RecordsAffected returns the number of records affected by the Statement
func (stmt *ExplainStatement) RecordsAffected() int64 {
	return 0
}

func (stmt *ExplainStatement) Validate() error {
	stmt.Subject.Validate()
	return nil
}

// Parse parses a SQL EXPLAIN statement.
func (stmt *ExplainStatement) Execute(ch chan *as.Result) error {
	if ch != nil {
		defer close(ch)
	}

	// signal header set
	ch <- nil

	for _, rec := range stmt.Subject.Explain() {
		ch <- &as.Result{Record: rec}
	}
	return nil
}

func (stmt *ExplainStatement) ApplyDriverValueArguments(args ...driver.Value) error {
	return nil
}

// Returns the number of input parameters represented by `?`
func (stmt *ExplainStatement) NumVars() int {
	return stmt.NumVars()
}
