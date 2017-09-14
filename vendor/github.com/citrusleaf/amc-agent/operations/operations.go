package operations

// This package is the base of the TAIL and QUERY operations.

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"io"

	"github.com/citrusleaf/amc-agent/logmanager"
	"github.com/citrusleaf/amc-agent/util"
)

var errNoContextPassed = errors.New("Context has not been passed")
var errNoWriterPassed = errors.New("Output writer has not been passed")
var errNoLogManagerPassed = errors.New("Log Manager Object has not been passed")
var errExtractKeyNotFound = errors.New("Extract Key not found.")

// This structure merges the LOGMANAGER and FILTER objects in one entity, along with a context and a io.Writer for pushing back the filtered lines.
type Operation struct {
	output      io.Writer
	lFilter     *util.LogFilter
	ctx         context.Context
	pReader     *io.PipeReader
	pWriter     *io.PipeWriter
	privateBuf  []byte
	keyValueBuf []byte
	extractKeys []string
	//filters []util.Filters
}

func ExecuteTailOperation(ctx context.Context, output io.Writer, lFilter *util.LogFilter, lm *logmanager.LogManager, extractKeys []string) error {
	if ctx == nil {
		util.Log.Error(errNoContextPassed.Error())
		return errNoContextPassed
	}

	if output == nil {
		util.Log.Error(errNoWriterPassed.Error())
		return errNoWriterPassed
	}

	if lm == nil {
		util.Log.Error(errNoLogManagerPassed.Error())
		return errNoLogManagerPassed
	}

	privateBuf := make([]byte, util.LineBytesBufferSize)
	ops := &Operation{
		output:      output,
		lFilter:     lFilter,
		ctx:         ctx,
		privateBuf:  privateBuf,
		extractKeys: extractKeys,
	}

	if lFilter == nil {
		err := lm.RegisterTailWriter(ops.output)
		if err != nil {
			util.Log.Error("Error in Registering Tail Writer ")
			return err
		}

		go ops.tailNoFilterOperation(ctx, lm)
		util.Log.Debug("Registering tail no filter operation")
	} else {
		ops.pReader, ops.pWriter = io.Pipe()
		err := lm.RegisterTailWriter(ops.pWriter)
		if err != nil {
			util.Log.Error("Error in Registering Tail Writer")
			return err
		}

		go ops.tailWithFilterOperation(ctx, lm)
		util.Log.Debug("Registering tail filter operation")
	}
	return nil
}

func NewQueryOperation(lf *util.LogFilter) *Operation {
	return nil
}

func (ops *Operation) tailNoFilterOperation(ctx context.Context, lm *logmanager.LogManager) {
	// waiting for done
	<-ctx.Done()
	util.Log.Debug("Received Context Cancel()")
	err := lm.UnregisterTailWriter(ops.output)
	if err != nil {
		util.Log.Debug("Error in UnRegistering Tail Writer")
	}
}

// iterating and passing the line to output writer
func (ops *Operation) tailWithFilterOperation(connCtx context.Context, lm *logmanager.LogManager) {
	ctx, cancel := context.WithCancel(context.Background())

	go func() {
		err := ops.tailFilterOperation()
		if err != nil {
			util.Log.Error("Error in Tail With filter Operation")
			cancel()
		}
	}()

	select {
	case <-connCtx.Done():
		util.Log.Debug("Received Network Context Cancel()")
		err := ops.unregisterFilterOperation(lm)
		if err != nil {
			util.Log.Error("Failed to unregister filter tail operation")
		}
	case <-ctx.Done():
		util.Log.Debug("Received tailFilterOperation Context Cancel()")
		err := ops.unregisterFilterOperation(lm)
		if err != nil {
			util.Log.Error("Failed to unregister filter tail operation")
		}
	}
}

func (ops *Operation) unregisterFilterOperation(lm *logmanager.LogManager) error {
	err := ops.pWriter.Close()
	if err != nil {
		util.Log.Debug("Error in closing pipe writer", err.Error())
		return err
	}
	err = ops.pReader.Close()
	if err != nil {
		util.Log.Debug("Error in closing pipe reader", err.Error())
		return err
	}
	err = lm.UnregisterTailWriter(ops.pWriter)
	if err != nil {
		util.Log.Debug("Error in UnRegistering Tail Writer")
		return err
	}
	return nil
}

func (ops *Operation) tailFilterOperation() error {
	for {

		len, err := ops.pReader.Read(ops.privateBuf)
		if err != nil {
			util.Log.Error("Error while copy from reader to private buffer", err.Error())
			return err
		} else if len == 0 {
			continue
		}

		if ops.applyFilter(len, ops.lFilter.Filters...) {
			util.Log.Debug("Filter Satisfied: " + string(ops.privateBuf[:len]))

			if ops.extractKeys != nil {
				ops.extractValue(len)

				if ops.keyValueBuf == nil {
					util.Log.Debug("No Values extracted")
					continue
				}

				util.Log.Debug("Value extracted : " + string(ops.keyValueBuf))

				_, err := ops.output.Write(ops.keyValueBuf)
				if err != nil {
					util.Log.Error("Error while writing from key-value buffer to output writer : ", err.Error())
					return err
				}

			} else {
				_, err := ops.output.Write(ops.privateBuf[:len])
				if err != nil {
					util.Log.Error("Error while writing from private buffer to output writer : ", err.Error())
					return err
				}
			}
		}

	}
}

// This method is the driver method for all filtering functions.
func (ops *Operation) applyFilter(n int, filters ...util.FilterFunc) bool {
	for _, filter := range filters {
		if !filter(ops.lFilter, ops.privateBuf[:n]) {
			return false
		}
	}
	return true
}

func (ops *Operation) extractValue(len int) {
	ops.keyValueBuf = nil

	for _, extractKey := range ops.extractKeys {
		if bytes.Contains(ops.privateBuf[:len], []byte(extractKey)) {
			token, err := parseLines(ops.privateBuf[:len], extractKey)
			if err != nil {
				continue
			}
			// appending keyword and value
			ops.keyValueBuf = append(ops.keyValueBuf, []byte(" "+extractKey+" "+string(token))...)
		}
	}

	if ops.keyValueBuf != nil {
		// appending timestamp
		ops.keyValueBuf = append(ops.privateBuf[:24], ops.keyValueBuf...)
		ops.keyValueBuf = append(ops.keyValueBuf, '\n')
	}
}

func parseLines(line []byte, extractKey string) ([]byte, error) {
	// There are five cases of formatting key-value in asadm. So given a keyword, we test all five formats for extracting the value.
	pos := bytes.Index(line, []byte(" "+extractKey+" "))
	if pos == -1 {
		// 5th case -> 5(7) key
		pos = bytes.Index(line, []byte(" "+extractKey))
		if pos == -1 {
			return nil, errExtractKeyNotFound
		}

		var i int
		for i = pos - 1; i >= 0; i-- {
			if line[i] == ' ' {
				break
			}
		}

		token := line[i+1 : pos]
		return token, nil
	}

	_, token, err := bufio.ScanWords(line[pos+len(extractKey)+2:], true)
	if err != nil {
		util.Log.Error("Error in scanning words, ", err.Error())
		return nil, err
	}

	if token[0] != '(' {
		// Case 1 -> CLUSTER-SIZE 1
		return token, nil
	}

	if token[0] == '(' && token[len(token)-1] == ')' {
		// Case 2 -> writes (2)
		// Case 3 -> writes (2,3,4)
		token = token[1 : len(token)-1]
		return token, nil
	}

	if token[0] == '(' && token[len(token)-1] != ')' {
		// Case 4 -> writes (240 total)
		token = token[1:]
		return token, nil
	}

	return nil, errExtractKeyNotFound
}
