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

// InsertStatement represents a SQL INSERT statement.
type InsertStatement struct {
	parser *AQLParser

	NamespaceName string
	SetName       string
	Bins          []*as.Bin
	Key           *as.Bin

	paramBins []*as.Bin
	paramKey  int

	numVars int

	RecordCount int64
}

// Parse parses a SQL INSERT statement.
func (p *AQLParser) ParseInsert() (stmt *InsertStatement, err error) {
	stmt = &InsertStatement{parser: p}

	// First token should be a "INSERT" keyword.
	if tok, lit := p.nextToken(); tok != INSERT {
		return nil, fmt.Errorf("found %q, expected INSERT", lit)
	}

	// Second token should be a "INTO" keyword.
	if tok, lit := p.nextToken(); tok != INTO {
		return nil, fmt.Errorf("found %q, expected INTO", lit)
	}

	// Finally we should read the set and table name.
	stmt.NamespaceName, stmt.SetName, err = p.ParseNamespaceAndSet()
	if err != nil {
		return nil, err
	}

	// Must read open paren
	if tok, lit := p.nextToken(); tok != PAREN_OPEN {
		return nil, fmt.Errorf("found %q, expected (", lit)
	}

	// Next we should loop over all our comma-delimited field names.
	i := 0
	keyIndex := -1
	for {
		// Read a field name.
		tok, lit := p.nextToken()
		if tok != IDENT && tok != PK {
			return nil, fmt.Errorf("found %q, expected field", lit)
		}

		if tok == PK {
			keyIndex = i
			stmt.Key = &as.Bin{Name: lit}
		} else {
			stmt.Bins = append(stmt.Bins, &as.Bin{Name: lit})
		}

		// If the next token is not a comma then break the loop.
		if tok, _ := p.nextToken(); tok != COMMA {
			p.unscan()
			break
		}

		i++
	}

	// Field list must have included PK
	if stmt.Key == nil {
		return nil, fmt.Errorf("No PK field is set in INSERT.")
	}

	// Must read a close paren
	if tok, lit := p.nextToken(); tok != PAREN_CLOSE {
		return nil, fmt.Errorf("found %q, expected )", lit)
	}

	// Must read VALUES
	if tok, lit := p.nextToken(); tok != VALUES {
		return nil, fmt.Errorf("found %q, expected VALUES keyword", lit)
	}

	// Must read open paren
	if tok, lit := p.nextToken(); tok != PAREN_OPEN {
		return nil, fmt.Errorf("found %q, expected (", lit)
	}

	// Next we should loop over all our comma-delimited field names.
	i = 0
	for {
		// Read a field name.
		val, err := p.scanValueOrParam()
		if err != nil {
			return nil, err
		}

		// guard against out-of-index errors; error will be caught later after the loop
		binIndex := 0
		if i < len(stmt.Bins)+1 {
			if i < keyIndex {
				binIndex = i - 1
				stmt.Bins[binIndex].Value = as.NewValue(val.Val)
			} else if i > keyIndex {
				binIndex = i - 1
				stmt.Bins[binIndex].Value = as.NewValue(val.Val)
			} else {
				stmt.Key.Value = as.NewValue(val.Val)
			}
		}

		// keep the reference of parameters
		if val.Type == PARAM {
			stmt.numVars++
			if i != keyIndex {
				stmt.paramBins = append(stmt.paramBins, stmt.Bins[binIndex])
			} else {
				stmt.paramKey = i
			}
		}

		// If the next token is not a comma then break the loop.
		if tok, _ := p.nextToken(); tok != COMMA {
			p.unscan()
			break
		}

		i++
	}

	// Must read a close paren
	if tok, lit := p.nextToken(); tok != PAREN_CLOSE {
		return nil, fmt.Errorf("found %q, expected )", lit)
	}

	// Must read an EOF
	if err := p.expectEOC(); err != nil {
		return nil, err
	}

	if i != len(stmt.Bins) {
		return nil, fmt.Errorf("field-value pair mismatch. There are %d fields defined, but %d values set", len(stmt.Bins)+1, i+1)
	}

	// Return the successfully parsed statement.
	return stmt, nil
}

func (stmt *InsertStatement) PostExecute() {
	fmt.Printf("%d row(s) affected", stmt.RecordsAffected())
}

// RecordsAffected returns the number of records affected by the Statement
func (stmt *InsertStatement) RecordsAffected() int64 {
	return stmt.RecordCount
}

func (stmt *InsertStatement) Validate() error {
	return nil
}

// Execute executes the SQL INSERT statement.
func (stmt *InsertStatement) Execute(ch chan *as.Result, node *as.Node) error {
	if ch != nil {
		defer close(ch)
	}

	// it is a PUT with a clear CREATE policy
	keyValue := stmt.Key.Value.GetObject()
	key, err := as.NewKey(stmt.NamespaceName, stmt.SetName, keyValue)
	if err != nil {
		// ch <- &as.Result{Err: err}
		return err
	}

	err = stmt.parser.Client.PutBins(InsertPolicy, key, stmt.Bins...)
	if err != nil {
		// ch <- &as.Result{Err: err}
		return err
	}

	stmt.RecordCount++
	return nil
}

func (stmt *InsertStatement) ApplyDriverValueArguments(args ...driver.Value) error {
	if len(args) != stmt.NumVars() {
		return fmt.Errorf("Wrong number of arguments supplied. Expected %d, got %d", len(stmt.paramBins), len(args))
	}

	j := 0
	for i := range args {
		if i != stmt.paramKey {
			stmt.paramBins[j].Value = as.NewValue(args[i])
			j++
		} else {
			stmt.Key.Value = as.NewValue(args[i])
		}
	}
	return nil
}

// Returns the number of input parameters represented by `?`
func (stmt *InsertStatement) NumVars() int {
	return stmt.numVars
}
