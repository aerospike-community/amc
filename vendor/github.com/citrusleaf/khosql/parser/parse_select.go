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

	as "github.com/aerospike/aerospike-client-go"
	"github.com/citrusleaf/khosql/types"
)

// SelectStatement represents a SQL SELECT statement.
type SelectStatement struct {
	parser *AQLParser

	WhereClause

	RecordCount int64

	Fields       []string
	FieldExprs   map[string]string
	FieldAliases map[string][]string

	AggregateFields *types.StringSet
	GroupByFields   *types.StringSet

	// isAggregate    bool
	AggFieldsCount int

	SelectExpressions []*Expression
	WhereExpressions  []*Expression

	isComplex       bool // if there are statements in fields
	IncludeAllField bool // there's an asterisk in the field list
}

// Parse parses a SQL SELECT statement.
func (p *AQLParser) ParseSelect() (stmt *SelectStatement, err error) {
	stmt = &SelectStatement{
		parser:          p,
		FieldExprs:      map[string]string{},
		FieldAliases:    map[string][]string{},
		AggregateFields: types.NewStringSet(4),
		GroupByFields:   types.NewStringSet(4),
	}
	// First token should be a "SELECT" keyword.
	if tok, lit := p.nextToken(); tok != SELECT {
		return nil, fmt.Errorf("found %q, expected SELECT", lit)
	}

	var expr *Expression

	// Next we should loop over all our comma-delimited fields.
L:
	for {
		// Read a field.
		expr, err = p.ParseExpression(true, _FROM_CLAUSE_TOKENS)
		if err != nil {
			return nil, err
		}

		// there's an asterisk in that function
		if expr == nil {
			break L
		}

		if expr.isAsterisk() {
			stmt.IncludeAllField = true
			stmt.Fields = append(stmt.Fields, expr.String())
		} else {
			fieldName := expr.String()

			// parse optional alias
			var alias string

			// if tok is ASTERISK, there will be no expression
			tok, _ := p.nextToken()
			if tok == AS {
				tok, alias = p.nextTokenAsIdent()
				if tok != IDENT && tok != STRING {
					return nil, fmt.Errorf("found %q, expected field", alias)
				}
			} else {
				// wasn't AS
				p.unscan()
			}

			stmt.Fields = append(stmt.Fields, expr.String())
			stmt.isComplex = stmt.isComplex || !(expr.isValue() || expr.isIdent())
			if !(expr.isValue() || expr.isIdent()) {
				stmt.FieldExprs[expr.String()] = "result = " + expr.LuaFuncString()
			}

			if expr.functionName != "" {
				stmt.AggregateFields.Add(expr.String())
				stmt.AggFieldsCount++
			}

			if alias != "" {
				stmt.FieldAliases[fieldName] = append(stmt.FieldAliases[fieldName], alias)
			}
		}

		// If the next token is not a comma then break the loop.
		if tok, _ := p.nextToken(); tok != COMMA {
			p.unscan()
			break
		}
	}

	// Next we should see the "FROM" keyword.
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

	if tok, _ := p.nextToken(); tok == GROUP {
		p.unscan()
		if err := p.parseGroupByClause(stmt); err != nil {
			return nil, err
		}
	} else {
		p.unscan()
	}

	// Must read an EOF
	if err := p.expectEOC(); err != nil {
		return nil, err
	}

	if err := stmt.Validate(); err != nil {
		return nil, err
	}

	// Return the successfully parsed statement.
	return stmt, nil
}

func (p *AQLParser) parseGroupByClause(stmt *SelectStatement) error {
	if tok, lit := p.nextToken(); tok != GROUP {
		return fmt.Errorf("found %q, expected GROUP", lit)
	}

	if tok, lit := p.nextToken(); tok != BY {
		return fmt.Errorf("found %q, expected BY", lit)
	}

	// Next we should loop over all our comma-delimited fields.
	for {
		// Read a field.
		tok, fieldName := p.nextToken()
		if tok != IDENT {
			return fmt.Errorf("found %q, expected field", fieldName)
		}

		if stmt.GroupByFields == nil {
			stmt.GroupByFields = types.NewStringSet(4)
		}
		stmt.GroupByFields.Add(fieldName)

		// If the next token is not a comma then break the loop.
		if tok, _ := p.nextToken(); tok != COMMA {
			p.unscan()
			break
		}
	}

	return nil
}

func (stmt *SelectStatement) FieldList() []string {
	return stmt.Fields
}

func (stmt *SelectStatement) Validate() error {
	// fmt.Println(stmt)
	uniqSelFields := map[string]struct{}{}
	for _, f := range stmt.Fields {
		uniqSelFields[f] = struct{}{}
	}

	if stmt.isAggregate() && (len(uniqSelFields)-stmt.AggFieldsCount) > stmt.GroupByFields.Len() {
		return errors.New("Not enough fields specified for group by clause.")
	}

	return nil
}

// RecordsAffected returns the number of records affected by the Statement
func (stmt *SelectStatement) RecordsAffected() int64 {
	return stmt.RecordCount
}

func (stmt *SelectStatement) PostExecute() {
	fmt.Printf("%d row(s) in set", stmt.RecordsAffected())
}

// Parse parses a SQL SELECT statement.
func (stmt *SelectStatement) Execute(ch chan *as.Result) error {
	defer close(ch)

	// fmt.Printf("STATEMENT: %#v\n", stmt)
	fmt.Printf("STATEMENT -Fields: %#v\n", stmt.Fields)
	fmt.Printf("STATEMENT -Field Aliases %#v\n", stmt.FieldAliases)
	for _, f := range stmt.Filters {
		fmt.Printf("STATEMENT -Filters: %#v\n", f.LuaFuncString())
	}
	fmt.Printf("STATEMENT -GroupBy: %#v\n", stmt.GroupByFields.Contents())
	fmt.Printf("STATEMENT -Agg Fields %#v\n", stmt.AggregateFields.Contents())
	fmt.Printf("STATEMENT -FieldExpressions %#v\n", stmt.FieldExprs)

	if !stmt.isComplex && !stmt.isAggregate() && len(stmt.Filters) == 0 {
		if stmt.PKFilter != nil {
			// it is a GET
			key, err := as.NewKey(stmt.NamespaceName, stmt.SetName, stmt.PKFilter.Value)
			if err != nil {
				ch <- &as.Result{Err: err}
				return err
			}

			var rec *as.Record
			if len(stmt.Fields) == 1 && stmt.Fields[0] == "*" {
				rec, err = stmt.parser.Client.Get(SelectReadPolicy, key)
			} else {
				rec, err = stmt.parser.Client.Get(SelectReadPolicy, key, stmt.Fields...)
			}

			if err != nil {
				ch <- &as.Result{Err: err}
				return err
			}

			// only if a record is found
			if rec != nil && len(rec.Bins) > 0 {
				if stmt.FieldAliases != nil {
					stmt.setAliases(rec)
				}

				stmt.updateBinNames(rec.Bins)
				ch <- nil

				ch <- &as.Result{Record: rec, Err: err}
				stmt.RecordCount++
			}

		} else {
			// it is a scan
			// setup statement
			binNames, err := stmt.binNames()
			if err != nil {
				ch <- &as.Result{Err: err}
				return err
			}
			stmt.updateBinNames(binNames)
			ch <- nil

			stm := as.NewStatement(stmt.NamespaceName, stmt.SetName)
			if !(len(stmt.Fields) == 1 && stmt.Fields[0] == "*") {
				stm.BinNames = stmt.Fields
			}
			if f := stmt.bestIndex(); f != nil {
				stm.Addfilter(f)
			}

			recordset, err := stmt.parser.Client.Query(SelectQueryPolicy, stm)
			defer recordset.Close()

			if err != nil {
				ch <- &as.Result{Err: err}
				return err
			}

			for result := range recordset.Results() {
				if stmt.FieldAliases != nil {
					stmt.setAliases(result.Record)
				}
				ch <- result
				stmt.RecordCount++
			}
		}
	} else {
		// it is a query with multiple filters
		binNames, err := stmt.binNames()
		if err != nil {
			ch <- &as.Result{Err: err}
			return err
		}
		stmt.updateBinNames(binNames)
		ch <- nil

		stm := as.NewStatement(stmt.NamespaceName, stmt.SetName)
		stm.BinNames = stmt.Fields

		functionArgsMap := map[string]interface{}{}

		if f := stmt.bestIndex(); f != nil {
			stm.Addfilter(f)
		}

		if len(stmt.Filters) > 0 {
			ff := []string{}
			for _, filter := range stmt.Filters {
				ff = append(ff, filter.LuaFuncString())
			}
			functionArgsMap["filterFuncStr"] = "if " + strings.Join(ff, " and ") + " then selectRec = true end"
		}

		functionArgsMap["includeAllFields"] = stmt.IncludeAllField

		if len(stmt.FieldExprs) > 0 {
			functionArgsMap["funcStmt"] = stmt.FieldExprs
		}

		if len(stm.BinNames) > 0 {
			functionArgsMap["selectFields"] = stm.BinNames
		}

		if stmt.AggregateFields != nil && stmt.AggregateFields.Len() > 0 {
			functionArgsMap["aggregateFields"] = stmt.AggregateFields.Contents()
		}

		if stmt.GroupByFields != nil && stmt.GroupByFields.Len() > 0 {
			functionArgsMap["groupByFields"] = stmt.GroupByFields.Contents()
		}

		// fmt.Printf("functionArgs: %#v\n", functionArgsMap)

		if stmt.isAggregate() {
			stm.SetAggregateFunction("aqlAPI", "select_agg_records", []as.Value{as.NewValue(functionArgsMap)}, true)
		} else {
			stm.SetAggregateFunction("aqlAPI", "select_records", []as.Value{as.NewValue(functionArgsMap)}, true)
		}

		recordset, err := stmt.parser.Client.Query(SelectQueryPolicy, stm)
		defer recordset.Close()

		if err != nil {
			ch <- &as.Result{Err: err}
			return err
		}

		var accu map[interface{}]interface{}

		for result := range recordset.Results() {
			if result.Err != nil {
				ch <- result
				return result.Err
			}

			fmt.Println(result.Record.Bins)
			// continue

			if binResults, exists := result.Record.Bins["SUCCESS"]; exists {

				if !stmt.isAggregate() {
					bins := binResults.(map[interface{}]interface{})

					binMap := make(as.BinMap, len(bins))

					for n, v := range bins {
						binMap[n.(string)] = v
					}
					result.Record.Bins = binMap
					stmt.setAliases(result.Record)
					ch <- result
					stmt.RecordCount++
				} else {
					bins := binResults.(map[interface{}]interface{})

					if accu == nil {
						accu = bins
					} else {
						accu = stmt.reduceBinResults(accu, bins)
					}

				}
			} else if binResults, exists := result.Record.Bins["FAILURE"]; exists {
				errMsg := binResults.(string)
				result.Record.Bins = nil
				result.Err = errors.New(errMsg)
				ch <- result
			} else {
				ch <- result
			}
		}

		if stmt.isAggregate() {

			for _, tuples := range accu {
				binMap := make(as.BinMap, len(accu))

				for n, v := range stmt.updateRecAggregates(tuples.(map[interface{}]interface{}))["rec"].(map[interface{}]interface{}) {
					binMap[n.(string)] = v
				}

				rec := &as.Record{Bins: binMap}
				if stmt.FieldAliases != nil {
					stmt.setAliases(rec)
				}

				ch <- &as.Result{Record: rec}
				stmt.RecordCount++
			}
		}
	}

	return nil
}

// updates stmt.Fields with all the bin names
func (stmt *SelectStatement) updateBinNames(binNames as.BinMap) {
	if !stmt.IncludeAllField {
		return
	}

	i := 0
	for i = range stmt.Fields {
		if stmt.Fields[i] == "*" {
			break
		}
	}

	newBinNames := make([]string, 0, len(stmt.Fields))
	copy(newBinNames, stmt.Fields[:i])

	for n, _ := range binNames {
		newBinNames = append(newBinNames, n)
	}

	if i < len(stmt.Fields[i]) {
		newBinNames = append(newBinNames, stmt.Fields[i+1:]...)
	}

	stmt.Fields = newBinNames
}

// returns all bin names in set for `select *` statements
func (stmt *SelectStatement) binNames() (binNames as.BinMap, err error) {
	// it is a query with multiple filters
	stm := as.NewStatement(stmt.NamespaceName, stmt.SetName)
	stm.BinNames = stmt.Fields

	functionArgsMap := map[string]interface{}{}

	if f := stmt.bestIndex(); f != nil {
		stm.Addfilter(f)
	}

	if len(stmt.Filters) > 0 {
		ff := []string{}
		for _, filter := range stmt.Filters {
			ff = append(ff, filter.LuaFuncString())
		}
		functionArgsMap["filterFuncStr"] = "if " + strings.Join(ff, " and ") + " then selectRec = true end"
	}

	// fmt.Printf("functionArgs: %#v\n", functionArgsMap)
	stm.SetAggregateFunction("aqlAPI", "query_bin_names", []as.Value{as.NewValue(functionArgsMap)}, true)

	recordset, err := stmt.parser.Client.Query(SelectQueryPolicy, stm)
	defer recordset.Close()

	if err != nil {
		return nil, err
	}

	binNames = as.BinMap{}
	for result := range recordset.Results() {
		if result.Err != nil {
			return nil, result.Err
		}

		// fmt.Println("==========================", result.Record.Bins)
		// cnt++
		// continue

		if binResults, exists := result.Record.Bins["SUCCESS"]; exists {
			bins := binResults.(map[interface{}]interface{})

			for name, _ := range bins {
				binNames[name.(string)] = struct{}{}
			}
		} else if binResults, exists := result.Record.Bins["FAILURE"]; exists {
			errMsg := binResults.(string)
			result.Record.Bins = nil
			result.Err = errors.New(errMsg)
			return nil, err
		} else {
			return nil, nil
		}
	}

	return binNames, nil
}

func (stmt *SelectStatement) isAggregate() bool {
	return len(stmt.AggregateFields.Contents()) > 0 || len(stmt.GroupByFields.Contents()) > 0
}

func (stmt *SelectStatement) setAliases(rec *as.Record) {
	for f, list := range stmt.FieldAliases {
		val := rec.Bins[f]
		delete(rec.Bins, f)
		for _, a := range list {
			rec.Bins[a] = val
		}
	}
}

func (stmt *SelectStatement) updateRecAggregates(tuple map[interface{}]interface{}) map[interface{}]interface{} {
	aggs := tuple["aggs"].(map[interface{}]interface{})
	rec := tuple["rec"].(map[interface{}]interface{})

	count := aggs["count"].(int)

	for f, v := range aggs {
		if strings.HasPrefix(f.(string), "sum(") {
			rec[f.(string)] = v
		} else if strings.HasPrefix(f.(string), "avg(") {
			var avg float64 = 0
			if count != 0 {
				avg = float64(v.(int)) / float64(count)
			}
			rec[f.(string)] = avg
		}

	}

	for f, _ := range rec {
		if strings.HasPrefix(f.(string), "count(") {
			rec[f.(string)] = count
		}
	}

	tuple["rec"] = rec
	return tuple
}

/*

	Utility Methods

*/

func (stmt *SelectStatement) reduceBinResults(accu1, accu2 map[interface{}]interface{}) map[interface{}]interface{} {

	for key, tuple := range accu2 {

		if _, exists := accu1[key]; exists {
			t := accu1[key].(map[interface{}]interface{})

			// accumulate
			aggs1 := t["aggs"].(map[interface{}]interface{})
			aggs2 := tuple.(map[interface{}]interface{})["aggs"].(map[interface{}]interface{})
			for fname, value := range aggs1 {
				aggs1[fname] = value.(int) + aggs2[fname.(string)].(int)
			}
			t["aggs"] = aggs1
			accu1[key] = t
		} else {
			// merge
			accu1[key] = tuple
		}
	}

	return accu1
}

// Returns the number of input parameters represented by `?`
func (stmt *SelectStatement) NumVars() int {
	return stmt.WhereClause.NumVars()
}
