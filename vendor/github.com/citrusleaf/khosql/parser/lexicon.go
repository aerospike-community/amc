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

type Token int

const (
	// control tokens
	INVALID Token = iota
	EOF
	EOC
	WTSPACE

	IDENT
	INTEGER
	FLOAT
	STRING

	DOT         // .
	COMMA       // ,
	PAREN_OPEN  // (
	PAREN_CLOSE // )
	ASTERISK    // *

	PARAM // ?

	// OPERANDS
	EQ  // =
	NEQ // !=
	LT  // <
	MT  // >
	LTE // <=
	MTE // >=

	ADD // +
	SUB // -
	DIV // /

	// Keywords
	SHOW
	FOR

	EXPLAIN
	SELECT
	INSERT
	UPDATE
	DELETE

	FROM
	INTO
	SET
	VALUES
	GROUP
	BY

	SUM
	COUNT
	AVG

	PK // primary key
	WHERE
	BETWEEN
	REGEXP
	AS

	// Logical Operands
	AND
	OR

	// commands
	HELP
	EXIT
)
