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
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

type ASIndex struct {
	Namespace, Set string
	Fieldname      string
	Type           as.IndexType
	IndexName      string
}

type IndexMapType map[string]*ASIndex

func (p *AQLParser) UpdateIndexMap() {
	if p.Client == nil {
		return
	}

	indexBinMap, err := (&ShowStatement{
		parser: p,
		Entity: "INDEXES",
	}).queryInfo()

	if err != nil {
		return
	}

	// map of [ns + '.' + set + '.' + fieldname+'.'+indexType] -> index
	indexes := make(IndexMapType, len(indexBinMap))
	for _, indexMap := range indexBinMap {
		index := &ASIndex{
			Namespace: indexMap["ns"].(string),
			Set:       indexMap["set"].(string),
			Fieldname: indexMap["bin"].(string),
			IndexName: indexMap["indexname"].(string),
		}

		if indexMap["type"].(string) == "TEXT" {
			index.Type = as.STRING
		} else {
			index.Type = as.NUMERIC
		}

		indexes[index.Namespace+"."+index.Set+"."+index.Fieldname+"."+string(index.Type)] = index
	}

	p.IndexMap.Set(indexes)
}

func (p *AQLParser) Tend() {
	go func() {
	L:
		for {
			select {
			case <-p.tendChan:
				return
			case <-time.After(time.Second):
				if len(p.Client.GetNodes()) == 0 {
					continue L
				}
				p.UpdateIndexMap()
			}
		}
	}()
}

func (p *AQLParser) SetClient(c *as.Client) {
	p.Client = c

	p.Tend()
}
