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
	"errors"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"

	as "github.com/aerospike/aerospike-client-go"
)

// DeleteStatement represents a SQL DELETE statement.
type DeleteStatement struct {
	parser *AQLParser

	WhereClause

	RecordCount int64

	wg sync.WaitGroup
}

// Parse parses a SQL DELETE statement.
func (p *AQLParser) ParseDelete() (stmt *DeleteStatement, err error) {
	stmt = &DeleteStatement{parser: p}

	// First token should be a "DELETE" keyword.
	if tok, lit := p.nextToken(); tok != DELETE {
		return nil, fmt.Errorf("found %q, expected DELETE", lit)
	}

	// Second token should be a "FROM" keyword.
	if tok, lit := p.nextToken(); tok != FROM {
		return nil, fmt.Errorf("found %q, expected FROM", lit)
	}

	// Finally we should read the set and table name.
	stmt.NamespaceName, stmt.SetName, err = p.ParseNamespaceAndSet()
	if err != nil {
		return nil, err
	}

	// Optional where clause
	err = p.scanWhereClause(&stmt.WhereClause, p.IndexMap)
	if err != nil {
		return nil, err
	}

	// Must read an EOF
	if err := p.expectEOC(); err != nil {
		return nil, err
	}

	// Return the successfully parsed statement.
	return stmt, nil
}

func (stmt *DeleteStatement) PostExecute() {
	fmt.Printf("%d row(s) affected", stmt.RecordsAffected())
}

// RecordsAffected returns the number of records affected by the Statement
func (stmt *DeleteStatement) RecordsAffected() int64 {
	return stmt.RecordCount
}

// Validate validates the SQL DELETE statement.
func (stmt *DeleteStatement) Validate() error {
	return nil
}

// Execute executes the SQL DELETE statement.
func (stmt *DeleteStatement) Execute(ch chan *as.Result) error {
	if ch != nil {
		defer close(ch)
	}

	err := stmt.execute(ch)
	stmt.wg.Wait()

	return err
}

func (stmt *DeleteStatement) execute(ch chan *as.Result) error {
	keys := make(chan *as.Key, 100)
	defer close(keys)

	if len(stmt.Filters) == 0 && stmt.PKFilter != nil {
		// it is a DELETE with a clear WRITE policy
		key, err := as.NewKey(stmt.NamespaceName, stmt.SetName, stmt.PKFilter.Value)
		if err != nil {
			return err
		}

		exists, err := stmt.parser.Client.Delete(DeletePolicy, key)

		// only if a record is found
		if err != nil {
			return err
			// ch <- &as.Result{Err: err}
		}

		if exists {
			stmt.RecordCount++
		}
	} else {
		// it is a query with multiple filters
		stm := as.NewStatement(stmt.NamespaceName, stmt.SetName)

		functionArgsMap := map[string]interface{}{}

		if f := stmt.bestIndex(); f != nil {
			stm.Addfilter(f)
		}

		if len(stmt.Filters) > 0 {
			fieldFilters := map[string]interface{}{}
			for _, filter := range stmt.Filters {
				fieldFilters[filter.String()] = filter.LuaFuncString()
			}
			functionArgsMap["filters"] = fieldFilters

			ff := []string{}
			for _, filter := range stmt.Filters {
				ff = append(ff, filter.LuaFuncString())
			}
			functionArgsMap["filterFuncStr"] = "if " + strings.Join(ff, " and ") + " then selectRec = true end"
		}

		stm.SetAggregateFunction("aqlAPI", "query_digests", []as.Value{as.NewValue(functionArgsMap)}, true)

		recordset, err := stmt.parser.Client.Query(SelectQueryPolicy, stm)
		if err != nil {
			// ch <- &as.Result{Err: err}
			return err
		}
		defer recordset.Close()

		stmt.wg.Add(10)
		for i := 0; i < 10; i++ {
			go stmt.ExecuteForKey(ch, keys, functionArgsMap)
		}

		for result := range recordset.Results() {
			if result.Err != nil {
				// ch <- result
				// return
				continue
			}

			// fmt.Println(result.Record.Bins)
			// continue

			if binResults, exists := result.Record.Bins["SUCCESS"]; exists {
				bins := binResults.(map[interface{}]interface{})

				key, err := as.NewKeyWithDigest(stmt.NamespaceName, stmt.SetName, nil, bins["d"].([]byte))
				if err != nil {
					// ch <- &as.Result{Err: err}
					continue
				}

				keys <- key
			} else if binResults, exists := result.Record.Bins["FAILURE"]; exists {
				errMsg := binResults.(string)
				result.Record.Bins = nil
				result.Err = errors.New(errMsg)
				// ch <- result
			} else {
				// ch <- result
			}
		}
	}
	return nil
}

func (stmt *DeleteStatement) ExecuteForKey(ch chan *as.Result, keys chan *as.Key, functionArgsMap map[string]interface{}) {
	defer stmt.wg.Done()
	for key := range keys {
		exists, err := stmt.parser.Client.Delete(DeletePolicy, key)
		if err != nil {
			// ch <- &as.Result{Err: err}
			continue
		}
		if exists {
			atomic.AddInt64(&stmt.RecordCount, 1)
		}
	}
}

// Returns the number of input parameters represented by `?`
func (stmt *DeleteStatement) NumVars() int {
	return 0
}
