package models

import (
	"fmt"
	"io"
	"time"

	as "github.com/aerospike/aerospike-client-go"
	"github.com/citrusleaf/khosql/parser"

	tabWriter "github.com/olekukonko/tablewriter"
)

func printResult(output io.Writer, ch chan *as.Result, stmt aql.SQLStatement) (count int, err error) {
	recs := make([]*as.Record, 100)

	var fields []string

	// select always sends a nil to signify field names are set
	if hStmt, ok := stmt.(aql.HasHeader); ok {
		// will be null
		<-ch

		fields = hStmt.FieldList()
	}

	t := time.Now()
	for res := range ch {
		if res.Err != nil {
			fmt.Fprintln(output, res.Err)
			return count, res.Err
		}

		recs[count%100] = res.Record
		count++

		if count%100 == 0 {
			printRecords(output, fields, recs)
		}
	}

	printRecords(output, fields, recs[:count%100])
	stmt.PostExecute()
	total := float64(time.Now().Sub(t)) / float64(time.Second)

	fmt.Fprintf(output, " (%5.4f secs)\n", total)

	return count, err
}

func printRecords(output io.Writer, binNames []string, recs []*as.Record) {
	if len(binNames) == 0 {
		bins := make(map[string]struct{}, 10)
		for _, rec := range recs {
			for bn, _ := range rec.Bins {
				bins[bn] = struct{}{}
			}
		}

		binNames = make([]string, 0, len(bins))
		for bn, _ := range bins {
			binNames = append(binNames, bn)
		}
	}

	if len(binNames) <= 0 {
		// nothing to print
		return
	}

	table := tabWriter.NewWriter(output)
	table.SetHeader(binNames)
	table.SetAlignment(tabWriter.ALIGN_LEFT)
	table.SetAutoFormatHeaders(false)

	row := make([]string, len(binNames))
	for _, r := range recs {
		for i, b := range binNames {
			row[i] = fmt.Sprintf("%v", r.Bins[b])
		}

		table.Append(row)
	}

	table.Render()
}
