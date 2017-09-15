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
	"bytes"
	"fmt"
	"strconv"

	as "github.com/aerospike/aerospike-client-go"
	"github.com/citrusleaf/khosql/types/atomic"
)

type Value struct {
	Type Token
	Val  interface{}
}

type parserBuffer struct {
	tok  Token  // last token
	lit  string // last literal
	size int    // buffer size (max=1)
}

func NewValue(t Token, lit string) *Value {
	switch t {
	case INTEGER:
		i, _ := strconv.ParseInt(lit, 10, 64)
		return &Value{Type: t, Val: int(i)}
	case FLOAT:
		f64, _ := strconv.ParseFloat(lit, 64)
		return &Value{Type: t, Val: f64}
	case STRING:
		return &Value{Type: t, Val: lit}
	case PARAM:
		return &Value{Type: t, Val: nil}
	}

	panic("Value is not supported")
}

type AQLParser struct {
	rw    *bytes.Buffer
	lexer *Lexer
	buf   parserBuffer

	tendChan chan struct{}
	IndexMap *atomic.Container
	Client   *as.Client
}

func NewParser(client *as.Client) *AQLParser {
	b := bytes.NewBuffer(nil)
	p := &AQLParser{
		rw:    b,
		lexer: NewLexer(b),

		tendChan: make(chan struct{}),
		Client:   client,
		IndexMap: atomic.NewContainer(IndexMapType{}),
	}

	p.Tend()

	return p
}

func (p *AQLParser) Close() {
	defer p.Client.Close()

	close(p.tendChan)
}

func (p *AQLParser) scanValue() (val *Value, err error) {
	tok, lit := p.nextToken()
	if !isValue(tok) {
		return nil, fmt.Errorf("found %q, expected a value", lit)
	}

	return NewValue(tok, lit), nil
}

func (p *AQLParser) scanValueOrParam() (val *Value, err error) {
	tok, lit := p.nextToken()
	if !isValueOrParam(tok) {
		return nil, fmt.Errorf("found %q, expected a value or parameter", lit)
	}

	return NewValue(tok, lit), nil
}

func (p *AQLParser) scanNumericValue() (val *Value, err error) {
	tok, lit := p.nextToken()
	if !isNumericValue(tok) {
		return nil, fmt.Errorf("found %q, expected a numeric value", lit)
	}

	return NewValue(tok, lit), nil
}

func (p *AQLParser) unscan() { p.buf.size = 1 }

func (p *AQLParser) scan() (tok Token, lit string) {
	return p.scanNext(false)
}

func (p *AQLParser) scanNext(noKeywords bool) (tok Token, lit string) {
	if p.buf.size != 0 {
		p.buf.size = 0
		return p.buf.tok, p.buf.lit
	}

	tok, lit = p.lexer.Scan(noKeywords)

	p.buf.tok, p.buf.lit = tok, lit

	return
}

func (p *AQLParser) scanNextAsIdent() (tok Token, lit string) {
	return p.scanNext(true)
}

func (p *AQLParser) expectEOC() error {
	if tok, lit := p.nextToken(); !isEOC(tok) {
		p.unscan()
		return fmt.Errorf("found %q, expected ; or EOF", lit)
	}
	return nil
}

func (p *AQLParser) nextToken() (tok Token, lit string) {
	tok, lit = p.scan()
	if tok == WTSPACE {
		tok, lit = p.scan()
	}
	return
}

func (p *AQLParser) nextTokenAsIdent() (tok Token, lit string) {
	tok, lit = p.scanNext(true)
	if tok == WTSPACE {
		tok, lit = p.scanNext(true)
	}
	return
}

func (p *AQLParser) peekToken() (tok Token, lit string) {
	tok, lit = p.scan()
	if tok == WTSPACE {
		tok, lit = p.scan()
	}
	p.unscan()

	return
}
