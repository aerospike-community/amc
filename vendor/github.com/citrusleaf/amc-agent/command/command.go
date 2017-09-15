package command

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"time"

	"github.com/citrusleaf/amc-agent/util"

	"github.com/citrusleaf/amc-agent/logmanager"
	"github.com/citrusleaf/amc-agent/operations"
)

type Parameters struct {
	// TODO : Think about transaction ID
	From, To    LogTime
	LogContexts []string
	LogLevel    string
	Keywords    []string
	Command     CommandType
	ExtractKeys []string
	Version     string
}

type Command struct {
	ctx    context.Context
	output io.Writer

	params Parameters
}

// TODO: follow up with the godocs
type LogTime struct {
	time.Time
}

var errNoDataReceived = errors.New("No data received")
var errInvalidCommandParameter = errors.New("Invalid Command Parameter")
var errNoWriterPassed = errors.New("Output writer has not been passed")
var errVersionNotSupported = errors.New("Command Version is not supported")

type CommandType string

const (
	TAIL           CommandType = "tail"
	QUERY          CommandType = "query"
	currentVersion             = "1.0"
)

func (lt *LogTime) UnmarshalJSON(data []byte) error {
	var timeInString string
	if err := json.Unmarshal(data, &timeInString); err != nil {
		util.Log.Error("From/to should be a string. Got %s", data, ". Error : ", err.Error())
		return err
	}
	t, err := time.Parse(util.AsLogTimeFormat, timeInString)
	if err != nil {
		util.Log.Error("Failed to parse Time. Error : ", err.Error())
		return err
	}
	lt.Time = t
	return nil
}

func NewCommand(writer io.Writer, data []byte) (*Command, error) {
	if len(data) == 0 {
		util.Log.Error(errNoDataReceived.Error())
		return nil, errNoDataReceived
	}

	if writer == nil {
		util.Log.Error(errNoWriterPassed.Error())
		return nil, errNoWriterPassed
	}

	cmd := &Command{}
	cmd.output = writer

	err := json.Unmarshal(data, &cmd.params)
	if err != nil {
		util.Log.Error("Error in Json Parsing. Error : " + err.Error())
		return nil, err
	}

	if cmd.params.Version != currentVersion {
		util.Log.Error("Error : " + err.Error())
		return nil, errVersionNotSupported
	}

	return cmd, nil
}

func (cmd *Command) HandleCommand(lm *logmanager.LogManager) (context.CancelFunc, error) {

	ctx, cancel := context.WithCancel(context.Background())
	cmd.ctx = ctx

	switch cmd.params.Command {

	case TAIL:
		err := cmd.processTailCommand(lm)
		if err != nil {
			util.Log.Error("Failed to process the new Tail Command")
			return nil, err
		}
		return cancel, nil

	case QUERY:
		err := cmd.processQueryCommand()
		if err != nil {
			util.Log.Error("Failed to process the new Query Command")
			return nil, err
		}
		return cancel, nil

	}

	util.Log.Error("Error : " + errInvalidCommandParameter.Error())
	return nil, errInvalidCommandParameter
}

func (cmd *Command) processTailCommand(lm *logmanager.LogManager) error {
	if len(cmd.params.LogContexts) == 0 && len(cmd.params.LogLevel) == 0 && len(cmd.params.Keywords) == 0 {
		go operations.ExecuteTailOperation(cmd.ctx, cmd.output, nil, lm, nil)
		util.Log.Info("Proccessed the new Unfilter Tail Command")
		return nil
	}

	filters := cmd.findCorrespondingFilterFunctions()
	lFilter, err := util.NewLogFilter(time.Time{}, time.Time{}, cmd.params.LogContexts, cmd.params.LogLevel, cmd.params.Keywords, filters)
	if err != nil {
		util.Log.Error("Failed to create filter object")
		return err
	}

	go operations.ExecuteTailOperation(cmd.ctx, cmd.output, lFilter, lm, cmd.params.ExtractKeys)
	util.Log.Info("Proccessed the new Filter Tail Command")

	return nil
}

func (cmd *Command) processQueryCommand() error {
	// filters := cmd.findCorrespondingFilterFunctions()

	// lFilter, err := util.NewLogFilter(cmd.jf.From.Time, cmd.jf.To.Time, cmd.jf.LogContexts, cmd.jf.LogLevel, cmd.jf.Keywords, filters)
	// if err != nil {
	// 	util.Log.Error("Failed to create filter object")
	// 	return err
	// }

	// go operations.NewQueryOperation(cmd.ctx, cmd.writer, lFilter, nil) // TODO : Change nil to lm object
	// util.Log.Info("Proccessed the new Query Command")

	return nil
}

func (cmd *Command) findCorrespondingFilterFunctions() []util.FilterFunc {
	var filters []util.FilterFunc
	if cmd.params.LogContexts != nil {
		filters = append(filters, util.FilterForContext)
	}
	if cmd.params.LogLevel != "" {
		filters = append(filters, util.FilterForLevel)
	}
	if cmd.params.Keywords != nil {
		filters = append(filters, util.FilterForKeyword)
	}
	return filters
}
