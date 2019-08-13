// Copyright 2013-2016 Aerospike, Inc.
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

package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"time"

	chart "github.com/wcharczuk/go-chart"
	drawing "github.com/wcharczuk/go-chart/drawing"
	"modernc.org/ql"
)

var (
	file = flag.String("f", "stats.json", "json file containing the stats.")
)

type Value struct {
	TS    int64
	Node  string
	Key   string
	Value int64
}

func main() {
	updateColors()

	flag.Parse()
	log.SetOutput(os.Stdout)
	log.SetFlags(0)

	buf, err := ioutil.ReadFile(*file)
	if err != nil {
		log.Fatalln(err)
	}

	l := make([]map[string]interface{}, 1000)
	err = json.Unmarshal(buf, &l)
	if err != nil {
		log.Fatalln(err)
	}

	schema := ql.MustSchema((*Value)(nil), "value", nil)
	indexes := ql.MustCompile(`
		BEGIN TRANSACTION;
			CREATE INDEX idx_key ON value (Key);
			CREATE INDEX idx_node ON value (Node);
			CREATE INDEX idx_ts ON value (TS);
		COMMIT;`,
	)
	ins := ql.MustCompile(`
		BEGIN TRANSACTION;
			INSERT INTO value VALUES($1, $2, $3, $4);
		COMMIT;`,
	)

	db, err := ql.OpenMem()
	if err != nil {
		panic(err)
	}

	ctx := ql.NewRWCtx()
	if _, _, err := db.Execute(ctx, schema); err != nil {
		panic(err)
	}

	if _, _, err := db.Execute(ctx, indexes); err != nil {
		panic(err)
	}

	t := time.Unix(1556875800, 0)
	for i, objs := range l {
		for _, obj := range objs {
			for node, values := range obj.(map[string]interface{}) {
				if values2, ok := values.(map[string]interface{}); ok {
					for header, value := range values2 {
						// fmt.Println(t.Add(5*time.Duration(i)*time.Second), node, header, value)
						ts := t.Add(5 * time.Duration(i) * time.Second)
						if _, _, err := db.Execute(ctx, ins, ql.MustMarshal(&Value{TS: ts.Unix(), Node: node, Key: header, Value: int64(value.(float64))})...); err != nil {
							panic(err)
						}
					}
				} else {
					// these are old aggregate values
				}
			}
		}
	}

	// remove_stats := ql.MustCompile(`
	// 	BEGIN TRANSACTION;
	// 		DELETE FROM value WHERE Key = "cluster-aggregated-stats";
	// 	COMMIT;`,
	// )
	// if _, _, err := db.Execute(ctx, remove_stats); err != nil {
	// 	panic(err)
	// }

	// rs, _, err := db.Run(nil, "SELECT * FROM value ORDER BY TS;")
	// if err != nil {
	// 	panic(err)
	// }

	// if err = rs[0].Do(true, func(data []interface{}) (bool, error) {
	// 	fmt.Println(data)
	// 	return true, nil
	// }); err != nil {
	// 	panic(err)
	// }

	// read metrics
	rs, _, err := db.Run(nil, "SELECT DISTINCT Key FROM value ORDER BY Key;")
	if err != nil {
		panic(err)
	}

	metrics := make([]string, 0, 20)
	if err = rs[0].Do(false, func(data []interface{}) (bool, error) {
		metrics = append(metrics, data[0].(string))
		return true, nil
	}); err != nil {
		panic(err)
	}

	// read nodes
	rs, _, err = db.Run(nil, "SELECT DISTINCT Node FROM value ORDER BY Node;")
	if err != nil {
		panic(err)
	}

	nodes := make([]string, 0, 20)
	if err = rs[0].Do(false, func(data []interface{}) (bool, error) {
		if data[0].(string) != "cluster-aggregated-stats" {
			nodes = append(nodes, data[0].(string))
		}
		return true, nil
	}); err != nil {
		panic(err)
	}

	fmt.Println("Metrics", metrics)
	fmt.Println("Nodes", nodes)

	for _, metric := range metrics {
		series := make(map[string][]Value, len(nodes))
		for _, node := range nodes {
			vals := make([]Value, 0, 100)

			// read nodes
			rs, _, err = db.Run(nil, "SELECT * FROM value WHERE Node=$1 AND Key=$2 ORDER BY TS;", node, metric)
			if err != nil {
				panic(err)
			}

			if err = rs[0].Do(false, func(data []interface{}) (bool, error) {
				v := Value{}
				if err := ql.Unmarshal(&v, data); err != nil {
					panic(err)
					return false, err
				}
				vals = append(vals, v)
				return true, nil
			}); err != nil {
				panic(err)
			}

			series[node] = vals
		}

		drawLargeChart(metric, nodes, series)
	}
}

func drawLargeChart(metric string, nodes []string, vals map[string][]Value) {

	switch metric {
	case "node-removed-count", "node-added-count", "tends-failed":
		fmt.Println(metric, vals)
		fmt.Println("==============================================================")
	default:
	}

	series := make([]chart.Series, len(vals))
	i := 0
	for _, node := range nodes {
		data := vals[node]

		xValues := make([]time.Time, len(data))
		yValues := make([]float64, len(data))

		for j, val := range data {
			xValues[j] = time.Unix(val.TS, 0)
			yValues[j] = float64(val.Value)
		}

		series[i] = chart.TimeSeries{
			Name:    fmt.Sprintf("%s", node),
			XValues: xValues,
			YValues: yValues,
		}

		i++
	}

	// annotations := chart.AnnotationSeries{
	// 	Annotations: []chart.Value2{
	// 		{XValue: 1.0, YValue: 1.0, Label: "One"},
	// 		{XValue: 2.0, YValue: 2.0, Label: "Two"},
	// 		{XValue: 3.0, YValue: 3.0, Label: "Three"},
	// 		{XValue: 4.0, YValue: 4.0, Label: "Four"},
	// 		{XValue: 5.0, YValue: 5.0, Label: "Five"},
	// 	},
	// }

	// series = append(series, annotations)

	graph := chart.Chart{
		Title:      metric,
		TitleStyle: chart.StyleShow(),
		Width:      1920,
		Height:     1200,
		XAxis: chart.XAxis{
			Name:           "Time",
			ValueFormatter: chart.TimeMinuteValueFormatter,
			NameStyle:      chart.StyleShow(),
			Style:          chart.StyleShow(),
		},
		YAxis: chart.YAxis{
			Name:      "Value",
			NameStyle: chart.StyleShow(),
			Style:     chart.StyleShow(),
		},
		Series: series,
	}

	//note we have to do this as a separate step because we need a reference to graph
	graph.Elements = []chart.Renderable{
		chart.LegendLeft(&graph),
	}

	res := bytes.NewBuffer([]byte{})
	graph.Render(chart.PNG, res)

	err := ioutil.WriteFile(metric+".png", res.Bytes(), 0644)
	if err != nil {
		log.Fatalln(err)
	}
}

func updateColors() {
	chart.DefaultColors = []drawing.Color{
		drawing.Color{102, 14, 0, 255},
		drawing.Color{166, 94, 83, 255},
		drawing.Color{242, 109, 61, 255},
		drawing.Color{102, 66, 26, 255},
		drawing.Color{217, 166, 108, 255},
		drawing.Color{51, 45, 38, 255},
		drawing.Color{242, 162, 0, 255},
		drawing.Color{153, 122, 0, 255},
		drawing.Color{255, 238, 0, 255},
		drawing.Color{103, 115, 57, 255},
		drawing.Color{230, 242, 182, 255},
		drawing.Color{212, 255, 128, 255},
		drawing.Color{34, 64, 0, 255},
		drawing.Color{24, 179, 0, 255},
		drawing.Color{67, 89, 73, 255},
		drawing.Color{26, 102, 66, 255},
		drawing.Color{121, 242, 202, 255},
		drawing.Color{153, 201, 204, 255},
		drawing.Color{0, 194, 242, 255},
		drawing.Color{26, 87, 102, 255},
		drawing.Color{0, 34, 64, 255},
		drawing.Color{51, 133, 204, 255},
		drawing.Color{191, 208, 255, 255},
		drawing.Color{51, 51, 102, 255},
		drawing.Color{137, 121, 242, 255},
		drawing.Color{68, 0, 255, 255},
		drawing.Color{14, 0, 51, 255},
		drawing.Color{54, 0, 102, 255},
		drawing.Color{47, 38, 51, 255},
		drawing.Color{195, 57, 230, 255},
		drawing.Color{238, 182, 242, 255},
		drawing.Color{100, 77, 102, 255},
		drawing.Color{115, 29, 109, 255},
		drawing.Color{230, 0, 153, 255},
		drawing.Color{64, 0, 43, 255},
		drawing.Color{127, 32, 57, 255},
		drawing.Color{255, 128, 162, 255},
		drawing.Color{255, 0, 34, 255},
		drawing.Color{204, 51, 71, 255},
		drawing.Color{204, 153, 10, 255},
	}
}
