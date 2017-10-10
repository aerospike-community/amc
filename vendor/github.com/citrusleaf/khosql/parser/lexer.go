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
	"bufio"
	"bytes"
	"fmt"
	"io"
	"strconv"
	"strings"
)

const endOfFile = rune(0)

type Lexer struct {
	rdr *bufio.Reader
}

func NewLexer(reader io.Reader) *Lexer {
	return &Lexer{
		rdr: bufio.NewReader(reader),
	}
}

func (l *Lexer) Scan(avoidKeywords bool) (tok Token, lit string) {
	rn := l.read()

	if isAlpha(rn) {
		l.unread()
		return l.scanNextAsIdent(avoidKeywords)
	} else if isWhitespace(rn) {
		l.unread()
		return l.scanWhitespace()
	} else if isNumeric(rn) {
		l.unread()
		return l.scanNumeric()
	} else if isQuote(rn) {
		return l.scanString()
	}

	switch rn {
	case ';':
		return EOC, string(rn)
	case endOfFile:
		return EOF, ""
	case '*':
		return ASTERISK, string(rn)
	case ',':
		return COMMA, string(rn)
	case '.':
		return DOT, string(rn)
	case '=':
		return EQ, string(rn)
	case '<':
		if l.read() == '=' {
			return LTE, "<="
		} else {
			l.unread()
		}
		return LT, string(rn)
	case '>':
		if l.read() == '=' {
			return MTE, ">="
		} else {
			l.unread()
		}
		return MT, string(rn)
	case '(':
		return PAREN_OPEN, string(rn)
	case ')':
		return PAREN_CLOSE, string(rn)
	case '+':
		return ADD, string(rn)
	case '-':
		return SUB, string(rn)
	case '/':
		return DIV, string(rn)
	case '?':
		return PARAM, string(rn)
	}

	return INVALID, string(rn)
}

func (l *Lexer) scanWhitespace() (tok Token, lit string) {
	var buf bytes.Buffer
	buf.WriteRune(l.read())

	for {
		if rn := l.read(); rn == endOfFile {
			break
		} else if !isWhitespace(rn) {
			l.unread()
			break
		} else {
			buf.WriteRune(rn)
		}
	}

	return WTSPACE, buf.String()
}

func (l *Lexer) scanNextAsIdent(avoidKeywords bool) (tok Token, lit string) {
	var buf bytes.Buffer
	buf.WriteRune(l.read())

	for {
		if rn := l.read(); rn == endOfFile {
			break
		} else if !isAlpha(rn) && !isNumeric(rn) && rn != '_' {
			l.unread()
			break
		} else {
			buf.WriteRune(rn)
		}
	}

	if !avoidKeywords {
		switch strings.ToUpper(buf.String()) {
		case "SELECT":
			return SELECT, buf.String()
		case "AS":
			return AS, buf.String()
		case "INSERT":
			return INSERT, buf.String()
		case "UPDATE":
			return UPDATE, buf.String()
		case "DELETE":
			return DELETE, buf.String()
		case "INTO":
			return INTO, buf.String()
		case "FROM":
			return FROM, buf.String()
		case "SET":
			return SET, buf.String()
		case "VALUES":
			return VALUES, buf.String()
		case "PK":
			return PK, buf.String()
		case "WHERE":
			return WHERE, buf.String()
		case "BETWEEN":
			return BETWEEN, buf.String()
		case "AND":
			return AND, buf.String()
		case "OR":
			return OR, buf.String()
		case "SHOW":
			return SHOW, buf.String()
		case "EXPLAIN":
			return EXPLAIN, buf.String()
		case "GROUP":
			return GROUP, buf.String()
		case "BY":
			return BY, buf.String()
		case "LIMIT":
			return LIMIT, buf.String()
		case "FOR":
			return FOR, buf.String()
		case "SUM":
			return SUM, buf.String()
		case "AVG":
			return AVG, buf.String()
		case "REGEXP":
			return REGEXP, buf.String()
		case "COUNT":
			return COUNT, buf.String()
		case "HELP":
			return HELP, buf.String()
		case "EXIT", "QUIT", "Q":
			return EXIT, buf.String()
		}
	}

	return IDENT, buf.String()
}

func (l *Lexer) scanNumeric() (tok Token, lit string) {
	var buf bytes.Buffer
	buf.WriteRune(l.read())

	tok = INTEGER
	for {
		if rn := l.read(); rn == endOfFile || isWhitespace(rn) || isDelimiter(rn) || isOperand(rn) {
			l.unread()
			break
		} else if rn == '.' {
			if tok == FLOAT {
				l.unread()
				return INVALID, buf.String()
			}
			tok = FLOAT
			buf.WriteRune(rn)
		} else if !isNumeric(rn) {
			l.unread()
			return INVALID, buf.String()
		} else {
			buf.WriteRune(rn)
		}
	}

	return tok, buf.String()
}

func (l *Lexer) scanString() (tok Token, lit string) {
	var buf bytes.Buffer

	for {
		if rn := l.read(); rn == endOfFile {
			return INVALID, buf.String()
		} else if isQuote(rn) {
			break
		} else {
			buf.WriteRune(rn)
		}
	}

	return STRING, buf.String()
}

func (l *Lexer) read() rune {
	rn, _, err := l.rdr.ReadRune()
	if err != nil {
		return endOfFile
	}
	return rn
}

func (l *Lexer) unread() {
	l.rdr.UnreadRune()
}

func (l *Lexer) peek() rune {
	rn := l.read()
	l.unread()
	return rn
}

func isAlpha(rn rune) bool { return (rn >= 'a' && rn <= 'z') || (rn >= 'A' && rn <= 'Z') }

func isNumeric(rn rune) bool { return (rn >= '0' && rn <= '9') }

func isQuote(rn rune) bool { return (rn == '\'') }

func isDelimiter(rn rune) bool { return (rn == ',' || rn == ')') }

func isOperand(rn rune) bool { return (rn == '+' || rn == '-' || rn == '*' || rn == '/') }

func isValue(t Token) bool { return (isNumericValue(t) || t == STRING) }

func isValueOrParam(t Token) bool { return (isNumericValue(t) || t == STRING || t == PARAM) }

func isNumericValue(t Token) bool { return (t == INTEGER || t == FLOAT) }

func isEOC(t Token) bool { return (t == EOC || t == EOF) }

func isArithmaticOperand(t Token) bool {
	return (t == ADD || t == SUB || t == ASTERISK || t == DIV)
}

func isLogicalOperand(t Token) bool {
	return (t == AND || t == OR)
}

func isComparisonOperand(t Token) bool {
	return (t == EQ || t == LT || t == LTE || t == MT || t == MTE)
}

func isWhitespace(rn rune) bool { return rn == ' ' || rn == '\t' || rn == '\n' }

func tokenToValue(tok Token, val string) interface{} {
	switch tok {
	case INTEGER:
		res, _ := strconv.ParseInt(val, 10, 64)
		return res
	case FLOAT:
		res, _ := strconv.ParseFloat(val, 64)
		return res
	case STRING:
		return val
	}

	panic(fmt.Errorf("(Token, Value) pair not supported: %v, %v", tok, val))
}
