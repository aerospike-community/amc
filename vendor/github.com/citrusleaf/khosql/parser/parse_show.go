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
	"regexp"
	"strconv"
	"strings"

	as "github.com/aerospike/aerospike-client-go"
)

type Entity string

const (
	EntityNamespaces = "NAMESPACES"
	EntitySets       = "SETS"
	EntityBins       = "BINS"
	EntityIndexes    = "INDEXES"
)

// ShowStatement represents a SQL SHOW statement.
type ShowStatement struct {
	fields []string

	parser *AQLParser

	NamespaceName string
	SetName       string
	Entity        string
}

// Parse parses a SQL SHOW statement.
func (p *AQLParser) ParseShow() (stmt *ShowStatement, err error) {
	stmt = &ShowStatement{parser: p}

	// First token should be a "SHOW" keyword.
	if tok, lit := p.nextToken(); tok != SHOW {
		return nil, fmt.Errorf("found %q, expected SHOW", lit)
	}

	// Read a entity
	tok, lit := p.nextToken()
	if tok != IDENT {
		return nil, fmt.Errorf("found %q, expected NAMESPACES | SETS | BINS | INDEXES", lit)
	}
	stmt.Entity = lit

	// Next we should see the *optional* "FOR" keyword.
	if tok, _ := p.nextToken(); tok != FOR {
		p.unscan()
	} else {
		// Finally we should read the set and table name.
		stmt.NamespaceName, stmt.SetName, err = p.ParseNamespaceAndSet()
		if err != nil {
			return nil, err
		}
	}

	// Must read an EOF
	if err := p.expectEOC(); err != nil {
		return nil, err
	}

	// Return the successfully parsed statement.
	return stmt, nil
}

func (stmt *ShowStatement) FieldList() []string {
	return stmt.fields
}

func (stmt *ShowStatement) PostExecute() {
}

// RecordsAffected returns the number of records affected by the Statement
func (stmt *ShowStatement) RecordsAffected() int64 {
	return 0
}

func (stmt *ShowStatement) Validate() error {
	return nil
}

// Parse parses a SQL SHOW statement.
func (stmt *ShowStatement) Execute(ch chan *as.Result) error {
	defer close(ch)

	binMaps, err := stmt.queryInfo()

	if err != nil {
		ch <- &as.Result{Err: err}
		return err
	} else {
		// signal header set
		ch <- nil

		for _, binMap := range binMaps {
			ch <- &as.Result{Record: &as.Record{Bins: binMap}}
		}

	}
	return nil
}

func (stmt *ShowStatement) queryInfo() ([]as.BinMap, error) {
	var parseFunc func(string) ([]as.BinMap, error)

	var infoCommand string

	entity := Entity(strings.ToUpper(stmt.Entity))

	switch entity {
	case EntityNamespaces:
		parseFunc = stmt.parseNamespaceInfo
		infoCommand = "namespaces"
	case EntitySets:
		parseFunc = stmt.parseSetInfo
		infoCommand = "sets"
		if stmt.NamespaceName != "" {
			infoCommand += "/" + stmt.NamespaceName
		}
	case EntityBins:
		parseFunc = stmt.parseBinInfo
		infoCommand = "bins"
		if stmt.NamespaceName != "" {
			infoCommand += "/" + stmt.NamespaceName
		}
		if stmt.SetName != "" {
			infoCommand += "/" + stmt.SetName
		}
	case EntityIndexes:
		parseFunc = stmt.parseIndexInfo
		infoCommand = "sindex"
		if stmt.NamespaceName != "" {
			infoCommand += "/" + stmt.NamespaceName
		}
		if stmt.SetName != "" {
			infoCommand += "/" + stmt.SetName
		}
	default:
		return nil, fmt.Errorf("Un-supported command format with token -  '%s'", stmt.Entity)
	}

	binMaps := []as.BinMap{}

	i := 0
	node := stmt.parser.Client.GetNodes()[0]
	if infoMap, err := as.RequestNodeInfo(node, infoCommand); err != nil {
		return nil, err
	} else {
		i++
		for _, v := range infoMap {
			if recs, err := parseFunc(v); err != nil {
				return nil, err
			} else {
				for _, binMap := range recs {
					if i == 1 {
						for k, _ := range binMap {
							stmt.fields = append(stmt.fields, k)
						}
					}
					binMaps = append(binMaps, binMap)
				}
			}
		}
	}
	return binMaps, nil
}

var binInfoRegexp = regexp.MustCompile(`((.+)\:)?num-bin-names=(\d+),bin-names-quota=(\d+),(.+)`)

func (stmt *ShowStatement) parseBinInfo(info string) ([]as.BinMap, error) {
	info = strings.Trim(info, " ;")
	results := binInfoRegexp.FindStringSubmatch(info)

	if len(results) != 6 {
		return nil, fmt.Errorf("No Bins found.")
	}

	bins := strings.Split(results[5], ",")
	binMaps := make([]as.BinMap, 0, len(bins))
	namespace := results[2]
	if namespace == "" {
		namespace = stmt.NamespaceName
	}

	for _, bin := range bins {
		count, _ := strconv.Atoi(results[3])
		quota, _ := strconv.Atoi(results[4])
		binMaps = append(binMaps, as.BinMap{
			"namespace": namespace,
			"count":     count,
			"quota":     quota,
			"bin":       bin,
		})
	}

	return binMaps, nil
}

var setInfoRegexp = regexp.MustCompile(`ns_name=(.+):set_name=(.+):n_objects=(\d+):set-stop-write-count=(\d+):set-evict-hwm-count=(\d+):set-enable-xdr=(.+):set-delete=(.+)`)

func (stmt *ShowStatement) parseSetInfo(info string) ([]as.BinMap, error) {
	infoList := strings.Split(strings.Trim(info, " ;"), ";")
	binMaps := make([]as.BinMap, 0, len(infoList))
	for _, info := range infoList {
		results := setInfoRegexp.FindStringSubmatch(info)

		if len(results) != 8 {
			return nil, fmt.Errorf("No Sets found.")
		}

		bins := strings.Split(results[5], ",")

		for _ = range bins {
			count, _ := strconv.Atoi(results[3])
			evict, _ := strconv.Atoi(results[5])
			stopw, _ := strconv.Atoi(results[4])
			binMaps = append(binMaps, as.BinMap{
				"namespace":            results[1],
				"set":                  results[2],
				"set-delete":           results[7],
				"set-evict-hwm-count":  evict,
				"set-stop-write-count": stopw,
				"set-enable-xdr":       results[6],
				"n_objects":            count,
			})
		}
	}

	return binMaps, nil
}

func (stmt *ShowStatement) parseNamespaceInfo(info string) ([]as.BinMap, error) {
	nsList := strings.Split(info, ";")
	binMaps := make([]as.BinMap, 0, len(nsList))
	for _, ns := range nsList {
		binMaps = append(binMaps, as.BinMap{
			"namespaces": ns,
		})
	}

	return binMaps, nil
}

func (stmt *ShowStatement) parseIndexInfo(info string) ([]as.BinMap, error) {
	binMaps := parseInfoList(info)
	if len(binMaps) == 0 {
		return nil, fmt.Errorf("No Indexes found.")
	}
	return binMaps, nil
}

func parseInfoList(info string) []as.BinMap {
	info = strings.Trim(info, " ;\t")

	if len(info) == 0 {
		return nil
	}

	infoList := strings.Split(info, ";")

	binMaps := make([]as.BinMap, 0, len(infoList))
	for _, info := range infoList {
		fields := parseInfoString(info)
		if fields != nil {
			binMaps = append(binMaps, fields)
		}
	}

	return binMaps
}

func parseInfoString(info string) as.BinMap {
	fields := strings.Split(info, ":")

	binMap := make(as.BinMap, len(fields))
	for _, field := range fields {
		pair := strings.Split(field, "=")

		if len(pair) != 2 {
			return nil
		}

		if intVal, err := strconv.Atoi(pair[1]); err == nil {
			binMap[pair[0]] = intVal
		} else {
			binMap[pair[0]] = pair[1]
		}
	}

	return binMap
}

func (stmt *ShowStatement) ApplyDriverValueArguments(args ...driver.Value) error {
	return nil
}

// Returns the number of input parameters represented by `?`
func (stmt *ShowStatement) NumVars() int {
	return 0
}
