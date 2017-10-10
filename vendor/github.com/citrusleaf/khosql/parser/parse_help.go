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

// HelpStatement represents a HELP statement.
type HelpStatement struct {
	Help Token
}

// Parse parses a HELP statement.
func (p *AQLParser) ParseHelp() (stmt *HelpStatement, err error) {
	stmt = &HelpStatement{}

	// First token should be a "HELP" keyword.
	if tok, lit := p.nextToken(); tok != HELP {
		return nil, fmt.Errorf("found %q, expected HELP", lit)
	}

	// Must read an EOF
	if err := p.expectEOC(); err != nil {
		return nil, err
	}

	return stmt, nil
}

func (stmt *HelpStatement) PostExecute() {
}

// RecordsAffected returns the number of records affected by the Statement
func (stmt *HelpStatement) RecordsAffected() int64 {
	return 0
}

func (stmt *HelpStatement) Validate() error {
	return nil
}

func (stmt *HelpStatement) ApplyDriverValueArguments(args ...driver.Value) error {
	return nil
}

// Returns the number of input parameters represented by `?`
func (stmt *HelpStatement) NumVars() int {
	return 0
}

// Execute executes the SQL DELETE statement.
func (stmt *HelpStatement) Execute(ch chan *as.Result, node *as.Node) error {
	defer close(ch)

	fmt.Println(`COMMANDS

    DDL
        CREATE INDEX <index> ON <ns>[.<set>] (<bin>) NUMERIC|STRING
        CREATE LIST/MAPKEYS/MAVALUES INDEX <index> ON <ns>[.<set>] (<bin>) NUMERIC|STRING
        DROP INDEX <ns>[.<set>] <index>
        REPAIR INDEX <index> ON <ns>[.<set>]

            <ns> is the namespace for the index.
            <set> is the set name for the index.
            <index> is the name of the index.

        Examples:

            CREATE INDEX idx_foo ON test.test (foo) NUMERIC
            DROP INDEX test.test idx_foo
            REPAIR INDEX idx_foo ON test.test

    DML
        INSERT INTO <ns>[.<set>] (PK, <bins>) VALUES (<key>, <values>)
        DELETE FROM <ns>[.<set>] WHERE PK = <key>

            <ns> is the namespace for the record.
            <set> is the set name for the record.
            <key> is the record's primary key.
            <key> is the record's primary key.
            <bins> is a comma-separated list of bin names.
            <values> is comma-separated list of bin values. Keep it NULL (case insensitive & w/o quotes) to delete the bin

        Examples:

            INSERT INTO test.test (PK, foo, bar) VALUES ('key1', 123, 'abc')
            DELETE FROM test.test WHERE PK = 'key1'

    EXPLAIN
        EXPLAIN SELECT ...

        Examples:

            EXPLAIN SELECT * FROM test.test where foo > 5

    QUERY
        SELECT <bins> FROM <ns>[.<set>]
        SELECT <bins> FROM <ns>[.<set>] WHERE <bin> < | <= | = | > | >= <value> [AND <more predicates>]*
        SELECT <bins> FROM <ns>[.<set>] WHERE <bin> REGEXEP <regexp> [AND <more predicates>]*
        SELECT <bins>, SUM(<expr>), AVG(<expr>), COUNT(*|<expr>) FROM <ns>[.<set>] GROUP BY <bin>, [<bin>]*
        SELECT <bins> FROM <ns>[.<set>] WHERE <bin> BETWEEN <lower> AND <upper>
        SELECT <bins> FROM <ns>[.<set>] WHERE PK = <key>
        SELECT <bins> FROM <ns>[.<set>] IN <indextype> WHERE <bin> = <value>
        SELECT <bins> FROM <ns>[.<set>] IN <indextype> WHERE <bin> BETWEEN <lower> AND <upper>

            <ns> is the namespace for the records to be queried.
            <set> is the set name for the record to be queried.
            <key> is the record's primary key.
            <bin> is the name of a bin.
            <value> is the value of a bin.
            <indextype> is the type of a index user wants to query. (LIST/MAPKEYS/MAPVALUES)
            <bins> can be either a wildcard (*) or a comma-separated list of bin names.
            <lower> is the lower bound for a numeric range query.
            <upper> is the lower bound for a numeric range query.
            <regexp> is a regular expression in a string. e.g.: '.*'

        Examples:

            SELECT * FROM test.test
            SELECT * FROM test.test WHERE PK = 'key1'
            SELECT foo, bar FROM test.test WHERE PK = 'key1'
            SELECT foo, bar FROM test.test WHERE foo = 123 and name = 'Emma'
            SELECT foo, bar FROM test.test WHERE foo BETWEEN 0 AND 999
            SELECT foo, bar FROM test.test WHERE FOO regexp '.*i.*' AND bar regexp '[A-D]+'
            SELECT foo, SUM(bar), AVG(bar), COUNT(*) FROM test.test WHERE foo BETWEEN 0 AND 999 GROUP BY foo

    MANAGE UDFS
        REGISTER MODULE '<filepath>'
        SHOW MODULES
        REMOVE MODULE <filename>
        DESC MODULE <filename>

            <filepath> is file path to the UDF module(in single quotes).
            <filename> is file name of the UDF module.

        Examples:

            REGISTER MODULE '~/test.lua'
            SHOW MODULES
            DESC MODULE test.lua
            REMOVE MODULE test.lua

    INVOKING UDFS
        EXECUTE <module>.<function>(<args>) ON <ns>[.<set>]
        EXECUTE <module>.<function>(<args>) ON <ns>[.<set>] WHERE PK = <key>
        AGGREGATE <module>.<function>(<args>) ON <ns>[.<set>] WHERE <bin> = <value>
        AGGREGATE <module>.<function>(<args>) ON <ns>[.<set>] WHERE <bin> BETWEEN <lower> AND <upper>

            <module> is UDF module containing the function to invoke.
            <function> is UDF to invoke.
            <args> is a comma-separated list of argument values for the UDF.
            <ns> is the namespace for the records to be queried.
            <set> is the set name for the record to be queried.
            <key> is the record's primary key.
            <bin> is the name of a bin.
            <value> is the value of a bin.
            <lower> is the lower bound for a numeric range query.
            <upper> is the lower bound for a numeric range query.

        Examples:

            EXECUTE myudfs.udf1(2) ON test.test
            EXECUTE myudfs.udf1(2) ON test.test WHERE PK = 'key1'
            AGGREGATE myudfs.udf2(2) ON test.test WHERE foo = 123
            AGGREGATE myudfs.udf2(2) ON test.test WHERE foo BETWEEN 0 AND 999

    INFO
        SHOW NAMESPACES | SETS | BINS | INDEXES
        SHOW SCANS | QUERIES
        STAT NAMESPACE <ns> | INDEX <ns> <indexname>
        STAT SYSTEM

    JOB MANAGEMENT
        KILL_QUERY <transaction_id>
        KILL_SCAN <scan_id>

    USER ADMINISTRATION
        CREATE USER <user> PASSWORD <password> ROLE[S] <role1>,<role2>...
            pre-defined roles: read|read-write|read-write-udf|sys-admin|user-admin
        DROP USER <user>
        SET PASSWORD <password> [FOR <user>]
        GRANT ROLE[S] <role1>,<role2>... TO <user>
        REVOKE ROLE[S] <role1>,<role2>... FROM <user>
        CREATE ROLE <role> PRIVILEGE[S] <priv1[.ns1[.set1]]>,<priv2[.ns2[.set2]]>...
            priv: read|read-write|read-write-udf|sys-admin|user-admin
            ns:   namespace.  Applies to all namespaces if not set.
            set:  set name.  Applie to all sets within namespace if not set.
                  sys-admin and user-admin can't be qualified with namespace or set.
        DROP ROLE <role>
        GRANT PRIVILEGE[S] <priv1[.ns1[.set1]]>,<priv2[.ns2[.set2]]>... TO <role>
        REVOKE PRIVILEGE[S] <priv1[.ns1[.set1]]>,<priv2[.ns2[.set2]]>... FROM <role>
        SHOW USER [<user>]
        SHOW USERS
        SHOW ROLE <role>
        SHOW ROLES

    SETTINGS
        TIMEOUT                       (time in ms, default: 1000 ms)
        RECORD_TTL                    (time in ms, default: 0 ms)
        VERBOSE                       (true | false, default false)
        ECHO                          (true | false, default false)
        FAIL_ON_CLUSTER_CHANGE        (true | false, default true, policy applies to scans)
        OUTPUT                        (table | json, default table)
        LUA_USERPATH                  <path>, default : /opt/aerospike/usr/udf/lua
        LUA_SYSPATH                   <path>, default : /opt/aerospike/sys/udf/lua

        To get the value of a setting, run:

            aql> GET <setting>

        To set the value of a setting, run:

            aql> SET <setting> <value>

    OTHER
        RUN <filepath>
        HELP
        QUIT|EXIT|Q`)

	return nil
}
