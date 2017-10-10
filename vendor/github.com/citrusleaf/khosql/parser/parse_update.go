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

// UpdateStatement represents a SQL UPDATE statement.
type UpdateStatement struct {
	parser *AQLParser

	WhereClause

	RecordCount int64

	UpdateMap map[string]string

	numVars int

	wg sync.WaitGroup
}

// Parse parses a SQL UPDATE statement.
func (p *AQLParser) ParseUpdate() (stmt *UpdateStatement, err error) {
	stmt = &UpdateStatement{
		parser:    p,
		UpdateMap: map[string]string{},
	}

	// First token should be a "UPDATE" keyword.
	if tok, lit := p.nextToken(); tok != UPDATE {
		return nil, fmt.Errorf("found %q, expected UPDATE", lit)
	}

	// Finally we should read the set and table name.
	stmt.NamespaceName, stmt.SetName, err = p.ParseNamespaceAndSet()
	if err != nil {
		return nil, err
	}

	// Second token should be a "SET" keyword.
	if tok, lit := p.nextToken(); tok != SET {
		return nil, fmt.Errorf("found %q, expected SET", lit)
	}

	for {
		// Read a field.
		binName, expr, err := p.scanSetArgument()
		if err != nil {
			return nil, err
		}

		if binName == "PK" {
			return nil, fmt.Errorf("PK cannot be updated using UPDATE")
		} else {
			stmt.UpdateMap[binName] = "rec['" + binName + "'] = " + expr.LuaFuncString()
		}

		// If the next token is not a comma then break the loop.
		if tok, _ := p.nextToken(); tok != COMMA {
			p.unscan()
			break
		}
	}

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

// RecordsAffected returns the number of records affected by the Statement
func (stmt *UpdateStatement) RecordsAffected() int64 {
	return stmt.RecordCount
}

func (stmt *UpdateStatement) PostExecute() {
	fmt.Printf("%d row(s) affected", stmt.RecordsAffected())
}

func (stmt *UpdateStatement) Validate() error {
	return nil
}

// Returns the number of input parameters represented by `?`
func (stmt *UpdateStatement) NumVars() int {
	return stmt.numVars + stmt.WhereClause.NumVars()
}

// Execute executes the SQL UPDATE statement.
func (stmt *UpdateStatement) Execute(ch chan *as.Result, node *as.Node) error {
	if ch != nil {
		defer close(ch)
	}

	err := stmt.execute(ch, node)
	stmt.wg.Wait()

	return err
}

func (stmt *UpdateStatement) execute(ch chan *as.Result, node *as.Node) error {
	keys := make(chan *as.Key, 100)
	defer close(keys)

	functionArgsMap := map[string]interface{}{}

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

	if len(stmt.UpdateMap) > 0 {
		functionArgsMap["funcStmt"] = stmt.UpdateMap
	}

	// fmt.Printf("functionArgs: %#v\n", functionArgsMap)

	stmt.wg.Add(10)
	for i := 0; i < 10; i++ {
		go stmt.ExecuteForKey(ch, keys, functionArgsMap)
	}

	if len(stmt.Filters) == 0 && stmt.PKFilter != nil {
		key, err := as.NewKey(stmt.NamespaceName, stmt.SetName, stmt.PKFilter.Value)
		if err != nil {
			ch <- &as.Result{Err: err}
			return err
		}

		keys <- key
	} else if idx := stmt.bestIndex(); idx != nil {
		// it is a query with multiple filters
		stm := as.NewStatement(stmt.NamespaceName, stmt.SetName)
		stm.Addfilter(idx)

		var updateTask *as.ExecuteTask
		var err error
		if node != nil {
			updateTask, err = stmt.parser.Client.ExecuteUDFNode(nil, node, stm, "aqlAPI", "update_record", as.NewValue(functionArgsMap))
		} else {
			updateTask, err = stmt.parser.Client.ExecuteUDF(nil, stm, "aqlAPI", "update_record", as.NewValue(functionArgsMap))
		}
		if err != nil {
			ch <- &as.Result{Err: err}
			return err
		}

		err = <-updateTask.OnComplete()
		if err != nil {
			ch <- &as.Result{Err: err}
			return err
		}
	} else {
		// it is a query with multiple filters
		stm := as.NewStatement(stmt.NamespaceName, stmt.SetName)

		if f := stmt.bestIndex(); f != nil {
			stm.Addfilter(f)
		}

		stm.SetAggregateFunction("aqlAPI", "query_digests", []as.Value{as.NewValue(functionArgsMap)}, true)

		recordset, err := stmt.parser.Client.Query(SelectQueryPolicy, stm)
		defer recordset.Close()

		if err != nil {
			ch <- &as.Result{Err: err}
			return err
		}

		for result := range recordset.Results() {
			if result.Err != nil {
				ch <- result
				return result.Err
			}

			// fmt.Println(result.Record.Bins)
			// continue

			if binResults, exists := result.Record.Bins["SUCCESS"]; exists {
				bins := binResults.(map[interface{}]interface{})

				key, err := as.NewKeyWithDigest(stmt.NamespaceName, stmt.SetName, nil, bins["d"].([]byte))
				if err != nil {
					ch <- &as.Result{Err: err}
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

func (stmt *UpdateStatement) ExecuteForKey(ch chan *as.Result, keys chan *as.Key, functionArgsMap map[string]interface{}) {
	defer stmt.wg.Done()
	for key := range keys {
		res, err := stmt.parser.Client.Execute(UpdatePolicy, key, "aqlAPI", "update_record", as.NewValue(functionArgsMap))
		if err == nil {
			bins := res.(map[interface{}]interface{})
			if bins["status"].(int) == 0 {
				atomic.AddInt64(&stmt.RecordCount, 1)
			}
		}
	}
}

// scanFilter scans the next filter for WHERE clause
func (p *AQLParser) scanSetArgument() (binName string, expr *Expression, err error) {
	// we should either read a PK or IDENT
	tok, binName := p.nextTokenAsIdent()
	if tok != IDENT {
		return "", nil, fmt.Errorf("found %q, expected a field name", binName)
	}

	// read =
	tok, lit := p.nextToken()
	if tok != EQ {
		return "", nil, fmt.Errorf("found %q, expected =", lit)
	}

	// read the value
	expr, err = p.ParseExpression(false, _FUNCTION_PARAM_CLAUSE_TOKENS)
	if err != nil {
		return "", nil, err
	}

	return binName, expr, nil
}
