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
	"fmt"
	"math"
	"strconv"
	"strings"

	as "github.com/aerospike/aerospike-client-go"
)

var _FUNCTION_TOKENS = []Token{SUM, AVG, COUNT}

var _WHERE_CLAUSE_TOKENS = []Token{
	AND,       // connectors
	PK, IDENT, // idents
	INTEGER, FLOAT, STRING, // values
	SUM, AVG, COUNT, // aggregation functions
	ADD, SUB, DIV, ASTERISK, // arithmetic
	BETWEEN, REGEXP, EQ, LT, LTE, MT, MTE, // logical predicates
	PARAM, // ?
}

var _FROM_CLAUSE_TOKENS = []Token{
	PK, IDENT, // idents
	INTEGER, FLOAT, STRING, // values
	SUM, AVG, COUNT, // aggregation functions
	ADD, SUB, DIV, ASTERISK, // arithmetic
}

var _FUNCTION_PARAM_CLAUSE_TOKENS = []Token{
	IDENT,                  // idents
	INTEGER, FLOAT, STRING, // values
	ADD, SUB, DIV, ASTERISK, // arithmetic
}

// FILTER = EXPR [= | < | > | <= | >= ] EXPR

// EXPR = VALUE
// EXPR = ( EXPR )
// EXPR = IDENT | VALUE [+ | - | / | *] IDENT | VALUE
// EXPR = EXPR [+ | - | / | *] EXPR

type Expression struct {
	Type               Token
	Value              interface{}
	Left, Right, Third *Expression

	inParens     bool
	functionName string
}

func ExtractFilter(tok Token, binName string, first, second interface{}) *as.Filter {

	// non-equality filters need to be of numeric types
	if tok != EQ {
		if _, ok := first.(int64); !ok {
			return nil
		}

		if _, ok := second.(int64); second != nil && !ok {
			return nil
		}
	}

	// read the value
	switch tok {
	case EQ:
		return as.NewEqualFilter(binName, first)
	case BETWEEN:
		return as.NewRangeFilter(binName, first.(int64), second.(int64))
	case LT:
		return as.NewRangeFilter(binName, math.MinInt64, first.(int64)-1)
	case LTE:
		return as.NewRangeFilter(binName, math.MinInt64, first.(int64))
	case MT:
		return as.NewRangeFilter(binName, first.(int64)+1, math.MaxInt64)
	case MTE:
		return as.NewRangeFilter(binName, first.(int64), math.MaxInt64)
	}

	return nil
}

func (expr *Expression) isAsterisk() bool {
	return expr != nil && expr.Type == ASTERISK && expr.Right == nil && expr.Left == nil
}

func (expr *Expression) isPK() bool {
	return expr != nil && expr.Type == PK
}

func (expr *Expression) isIdent() bool {
	return expr != nil && expr.Type == IDENT
}

func (expr *Expression) isValue() bool {
	return expr != nil && (expr.Type == INTEGER || expr.Type == STRING || expr.Type == PARAM)
}

func (expr *Expression) isArgument() bool {
	return expr != nil && (expr.Type == PARAM)
}

func (expr *Expression) AsIndexType() as.IndexType {
	e := expr

	if expr.isValue() {
	} else if expr.Left.isValue() {
		e = expr.Left
	} else if expr.Right.isValue() {
		e = expr.Right
	}

	switch e.Type {
	case INTEGER:
		return as.NUMERIC
	case STRING:
		return as.STRING
	default:
		return as.IndexType("") // invalid
	}
}

func (expr *Expression) Filter() (filter *Filter) {
	if expr == nil {
		return nil
	}

	var asFilter *as.Filter
	var fieldName string

	switch expr.Type {
	case EQ, LT, LTE, MT, MTE, BETWEEN:
		// if left or right is an ident and the other is INTEGER or STRING
		if expr.Left.isIdent() && expr.Right.isValue() {
			fieldName = expr.Left.Value.(string)
			if expr.Type == BETWEEN {
				asFilter = ExtractFilter(expr.Type, expr.Left.Value.(string), expr.Right.Value, expr.Third.Value)
			} else {
				asFilter = ExtractFilter(expr.Type, expr.Left.Value.(string), expr.Right.Value, nil)
			}
		} else if expr.Left.isValue() && expr.Right.isIdent() {
			fieldName = expr.Right.Value.(string)
			if expr.Type == BETWEEN {
				asFilter = ExtractFilter(expr.Type, expr.Right.Value.(string), expr.Left.Value.(string), expr.Third.Value.(string))
			} else {
				asFilter = ExtractFilter(expr.Type, expr.Right.Value.(string), expr.Left.Value.(string), nil)
			}
		}
		// case AND:
		// 	fl := expr.Left.ExtractFilters()
		// 	fr := expr.Right.ExtractFilters()
		// 	filters = append(filters, fl...)
		// 	filters = append(filters, fr...)
		// 	return filters
	}

	if asFilter != nil {
		return &Filter{Expression: expr, Type: expr.AsIndexType(), asFilter: asFilter, BinName: fieldName}
	}

	return nil
}

func (expr *Expression) String() string {

	if expr == nil {
		return ""
	}

	// fmt.Println("----", expr.Type,
	// 	expr.Value,
	// 	expr.Left, expr.Right, expr.Third,
	// 	expr.inParens,
	// 	expr.functionName,
	// )

	res := expr.functionName
	if expr.inParens || len(expr.functionName) > 0 {
		res += "("
	}

	switch expr.Type {
	case IDENT:
		res += expr.Value.(string)
	case INTEGER:
		res += strconv.FormatInt(expr.Value.(int64), 10)
	case FLOAT:
		res += strconv.FormatFloat(expr.Value.(float64), 'f', 6, 64)
	case STRING:
		res += "'" + expr.Value.(string) + "'"
	case BETWEEN:
		res += expr.Left.String() + fmt.Sprintf(" BETWEEN %v and %v", expr.Right.String(), expr.Third.String())
	case PARAM:
		res += "?"
	default:
		a := []string{}

		if val := expr.Left.String(); len(val) > 0 {
			a = append(a, val)
		}

		if expr.Value != nil {
			a = append(a, expr.Value.(string))
		}

		if val := expr.Right.String(); len(val) > 0 {
			a = append(a, val)
		}

		res += strings.Join(a, " ")
	}

	if expr.inParens || len(expr.functionName) > 0 {
		res += ")"
	}

	return res
}

func (expr *Expression) LuaFuncString() string {

	if expr == nil || expr.functionName == "count" {
		return ""
	}

	res := ""
	if expr.inParens {
		res += "("
	}

	switch expr.Type {
	case IDENT:
		res += "rec['" + expr.Value.(string) + "']"
	case INTEGER:
		res += strconv.FormatInt(expr.Value.(int64), 10)
	case FLOAT:
		res += strconv.FormatFloat(expr.Value.(float64), 'f', 6, 64)
	case STRING:
		res += "'" + expr.Value.(string) + "'"
	case BETWEEN:
		f := expr.Left.LuaFuncString()
		res += fmt.Sprintf("( (%s >= %v) and (%s <= %v) )", f, expr.Right.LuaFuncString(), f, expr.Third.LuaFuncString())
	case EQ:
		res += expr.Left.LuaFuncString() + " == " + expr.Right.LuaFuncString()
	case REGEXP:
		res += "string.match(" + expr.Left.LuaFuncString() + ", " + expr.Right.LuaFuncString() + ")"
	case PARAM:
		res += fmt.Sprintf("%v", expr.Value)
	default:
		res += expr.Left.LuaFuncString()
		if expr.Value != nil {
			res += " " + fmt.Sprintf("%v", expr.Value)
		}
		if expr.Right != nil {
			res += " " + expr.Right.LuaFuncString()
		}
	}

	if expr.inParens {
		res += ")"
	}

	return res
}

func (p *AQLParser) ParseFunction() (expr *Expression, err error) {
	tok, functionName := p.nextToken()

	// if TOK is SUM | AVG | COUNT, look for open parent next
	if !tokenIn(tok, _FUNCTION_TOKENS) {
		return nil, fmt.Errorf("found %q, expected SUM, COUNT, AVG", functionName)
	}

	functionName = strings.ToLower(functionName)

	tok, lit := p.nextToken()
	if tok != PAREN_OPEN {
		return nil, fmt.Errorf("found %q, expected(", lit)
	}

	// no functions are allowed in function arguments
	funcArgument, err := p.ParseExpression(false, _FUNCTION_PARAM_CLAUSE_TOKENS)
	if err != nil {
		return nil, err
	}

	// ASTERISK is only supported on COUNT
	if funcArgument.isAsterisk() && functionName != "count" {
		return nil, fmt.Errorf("'*' is not supported in %q", functionName)
	}

	tok, lit = p.nextToken()
	if tok != PAREN_CLOSE {
		return nil, fmt.Errorf("found %q, expected )", lit)
	}

	expr = &Expression{functionName: functionName, Right: funcArgument}

	return expr, nil
}

func (p *AQLParser) ParseExpression(allowFunctions bool, allowedTokens []Token) (expr *Expression, err error) {
	expr = &Expression{}
	exprLeft := &Expression{}

	// Read the left side of the expression
	tok, lit := p.nextToken()

	// expectParenToClose := false
	if tok == PAREN_OPEN {
		// expectParenToClose = true
		exprLeft, err = p.ParseExpression(allowFunctions, allowedTokens)
		exprLeft.inParens = true

		tok, lit = p.nextToken()
		if tok != PAREN_CLOSE {
			return nil, fmt.Errorf("found %q, expected )", lit)
		}
	} else {
		// Read a token.
		// if an ident or value, return right away
		if !tokenIn(tok, allowedTokens) {
			p.unscan()
			return nil, fmt.Errorf("found %q, expected expression, value or field name", lit)
		}

		exprLeft.Type = tok

		// asterisk in the begginning of an expression means an sql *
		// return immediately
		if tok == ASTERISK {
			exprLeft.Value = lit
			return exprLeft, nil
		}

		if tok == IDENT || tok == PK {
			exprLeft.Value = lit
		} else if isValue(tok) {
			exprLeft.Value = tokenToValue(tok, lit)
		} else if tok == PARAM {
			exprLeft.Value = nil
		} else {
			p.unscan()
			// return nil, fmt.Errorf("found %q, expected a field name or value", lit)
		}
	}

	// if we find an operand, then it means there is a second part to the expression
	tok, lit = p.nextToken()
	expr.Type = tok
	expr.Value = lit

	// read the first part, which should be a IDENT, OR VALUE
	// Don't set it if it has been set by function parser above
	// Read a token.
	if tokenIn(tok, _FUNCTION_TOKENS) {
		if allowFunctions {
			p.unscan()

			// functions are treated like values and are returned immediately
			expr, err = p.ParseFunction()
			if err != nil {
				return nil, err
			}
			expr.Left = exprLeft
		} else {
			return nil, fmt.Errorf("found function %q, while functions are not allowed here", lit)
		}
	} else if isArithmaticOperand(tok) || isComparisonOperand(tok) || tok == REGEXP {
		expr.Left = exprLeft

		expr.Right, err = p.ParseExpression(allowFunctions, allowedTokens)
		if err != nil {
			return nil, err
		}
	} else if tok == BETWEEN {
		// read the value
		expr.Right, err = p.ParseExpression(false, _FUNCTION_PARAM_CLAUSE_TOKENS)
		if err != nil {
			return nil, err
		}

		// read the value
		tok, lit := p.nextToken()
		if tok != AND {
			return nil, fmt.Errorf("found %q, expected AND", lit)
		}

		// read the value
		expr.Third, err = p.ParseExpression(false, _FUNCTION_PARAM_CLAUSE_TOKENS)
		if err != nil {
			return nil, err
		}

		expr.Left = exprLeft
	} else {
		p.unscan()
		expr = exprLeft
	}

	return expr, nil
}

func tokenIn(tok Token, tokenList []Token) bool {
	for _, t := range tokenList {
		if tok == t {
			return true
		}
	}
	return false
}
