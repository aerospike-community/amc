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
	"github.com/citrusleaf/khosql/types/atomic"
)

type FilterType int

const (
	EqualFilter FilterType = iota
	RangeFilter
)

type Filter struct {
	Type       as.IndexType
	asFilter   *as.Filter
	BinName    string
	Expression *Expression
}

func (f *Filter) String() string {
	return fmt.Sprintf("%s on %s (%s)", f.Type, f.BinName, f.Expression)
}

type WhereClause struct {
	SQLStatement

	NamespaceName string
	SetName       string

	PKFilter *Expression
	Filters  []*Expression

	SQLParams []*Expression // field = ?

	indexMap *atomic.Container

	aerospikeIndex []*Filter
}

// scanWhereClause scans the next non-whitespace value.
func (p *AQLParser) scanWhereClause(wc *WhereClause, indexMap *atomic.Container) (err error) {
	wc.indexMap = indexMap

	// read where keyword
	tok, _ := p.nextToken()
	if tok != WHERE {
		p.unscan()
		return nil
	}

	for {
		expr, err := p.ParseExpression(false, _WHERE_CLAUSE_TOKENS)
		if err != nil {
			return err
		} else if len(expr.String()) == 0 {
			return fmt.Errorf("Empty condition found")
		}

		// fmt.Println(expr.String())

		if expr.Type == EQ && (expr.Left.isPK() || expr.Right.isPK()) {
			if expr.Left.isPK() {
				wc.PKFilter = expr.Right
			} else {
				wc.PKFilter = expr.Left
			}
		} else {
			if f := expr.Filter(); f != nil {
				wc.aerospikeIndex = append(wc.aerospikeIndex, f)
			}

			wc.Filters = append(wc.Filters, expr)
		}

		if expr.Left.isArgument() {
			wc.SQLParams = append(wc.SQLParams, expr.Left)
		}
		if expr.Right.isArgument() {
			wc.SQLParams = append(wc.SQLParams, expr.Right)
		}

		tok, _ := p.nextToken()
		if tok != AND {
			p.unscan()
			break
		}
	}

	return nil
}

func (stmt *WhereClause) ApplyDriverValueArguments(args ...driver.Value) error {
	if len(args) != stmt.NumVars() {
		return fmt.Errorf("Wrong number of arguments supplied. Expected %d, got %d", len(stmt.SQLParams), len(args))
	}

	for i := range stmt.SQLParams {
		stmt.SQLParams[i].Value = args[i]
		switch args[i].(type) {
		case int, int64, uint64, uint, uint8, int8, int16, int32, uint16, uint32:
			stmt.SQLParams[i].Type = INTEGER
		case string:
			stmt.SQLParams[i].Type = STRING
		}
	}
	return nil
}

func (stmt *WhereClause) Explain() []*as.Record {
	desc := ""

	if stmt.PKFilter == nil {
		if f, idx := stmt.bestIndexInfo(); f != nil {
			desc = fmt.Sprintf("QUERY PATH %s.%s USING INDEX %s (%s)", stmt.NamespaceName, stmt.SetName, idx.IndexName, f.Expression.String())
		} else {
			desc = fmt.Sprintf("SCAN PATH %s.%s", stmt.NamespaceName, stmt.SetName)
		}
	} else {
		desc = fmt.Sprintf("GET NAMESPACE.SET %s.%s USING PK = %s", stmt.NamespaceName, stmt.SetName, stmt.PKFilter.String())
	}

	rec := &as.Record{Bins: as.BinMap{"description": desc}}

	return []*as.Record{rec}
}

// Returns the number of input parameters represented by `?`
func (stmt *WhereClause) NumVars() int {
	return len(stmt.SQLParams)
}

func (stmt *WhereClause) bestIndex() *as.Filter {
	indexList := stmt.indexMap.Get().(IndexMapType)

	// for _, fltr := range stmt.aerospikeIndex {
	for _, fltr1 := range stmt.Filters {
		fltr := fltr1.Filter()
		if fltr == nil {
			continue
		}
		path := stmt.NamespaceName + "." + stmt.SetName + "." + string(fltr.BinName) + "." + string(fltr.Type)
		if _, exists := indexList[path]; exists {
			return fltr.asFilter
		}
	}
	return nil
}

func (stmt *WhereClause) bestIndexInfo() (*Filter, *ASIndex) {
	indexList := stmt.indexMap.Get().(IndexMapType)

	// for _, fltr := range stmt.aerospikeIndex {
	for _, fltr1 := range stmt.Filters {
		fltr := fltr1.Filter()
		if fltr == nil {
			continue
		}
		path := stmt.NamespaceName + "." + stmt.SetName + "." + string(fltr.BinName) + "." + string(fltr.Type)
		if idx, exists := indexList[path]; exists {
			return fltr, idx
		}
	}
	return nil, nil
}
