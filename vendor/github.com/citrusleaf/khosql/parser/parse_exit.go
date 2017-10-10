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
	"errors"
	"fmt"

	as "github.com/aerospike/aerospike-client-go"
)

// This error will cause the main to exit
type ErrExit error

var ExitError ErrExit = ErrExit(errors.New(""))

// ExitStatement represents a EXIT statement.
type ExitStatement struct {
	Exit Token
}

// Parse parses a EXIT statement.
func (p *AQLParser) ParseExit() (stmt *ExitStatement, err error) {
	stmt = &ExitStatement{}

	// First token should be a "EXIT" keyword.
	if tok, lit := p.nextToken(); tok != EXIT {
		return nil, fmt.Errorf("found %q, expected EXIT", lit)
	}

	// Must read an EOF
	if err := p.expectEOC(); err != nil {
		return nil, err
	}

	return stmt, nil
}

func (stmt *ExitStatement) PostExecute() {
}

// RecordsAffected returns the number of records affected by the Statement
func (stmt *ExitStatement) RecordsAffected() int64 {
	return 0
}

func (stmt *ExitStatement) Validate() error {
	return nil
}

// Execute executes the statement.
func (stmt *ExitStatement) Execute(ch chan *as.Result, node *as.Node) error {
	if ch != nil {
		defer close(ch)
	}

	return ExitError
}

func (stmt *ExitStatement) ApplyDriverValueArguments(args ...driver.Value) error {
	return nil
}

// Returns the number of input parameters represented by `?`
func (stmt *ExitStatement) NumVars() int {
	return 0
}
