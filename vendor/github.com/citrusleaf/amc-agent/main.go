package agent

import (
	"bufio"
	"encoding/json"
	"io"
	"net"
	"time"

	"github.com/citrusleaf/amc-agent/util"
)

// func logMemStats() {
// 	var mstats runtime.MemStats
// 	for {
// 		runtime.ReadMemStats(&mstats)
// 		util.Log.Printf("Alloc: %v, TotalAlloc: %v, Sys: %v, Lookups: %v, Mallocs: %v, Frees: %v, HeapAlloc: %v, HeapSys: %v, HeapIdle: %v, HeapInuse: %v, HeapReleased: %v, HeapObjects: %v, StackInuse: %v, StackSys: %v", mstats.Alloc, mstats.TotalAlloc, mstats.Sys, mstats.Lookups, mstats.Mallocs, mstats.Frees, mstats.HeapAlloc, mstats.HeapSys, mstats.HeapIdle, mstats.HeapInuse, mstats.HeapReleased, mstats.HeapObjects, mstats.StackInuse, mstats.StackSys)
// 		time.Sleep(10 * time.Second)
// 	}
// }

type jsonCommand struct {
	// TODO : Think about transaction ID
	LogContexts []string
	LogLevel    string
	Keywords    []string
	Command     string
	ExtractKeys []string
}

func Tail(protocol, host string, w *io.PipeWriter, timeout time.Duration) error {
	tconn, err := net.DialTimeout(protocol, host, 15*time.Second)
	if err != nil {
		util.Log.Errorln(err.Error())
		return err
	}

	cmd := jsonCommand{
		Command:     "tail",
		LogContexts: nil,
		LogLevel:    "",
		Keywords:    nil,
		ExtractKeys: nil,
	}

	if err = createCommandAndSend(cmd, tconn); err != nil {
		util.Log.Errorln(err.Error())
		return err
	}

	lineScanner := bufio.NewScanner(tconn)
	go readLinesFromConn(tconn, lineScanner, w, timeout)

	return nil
}

func createCommandAndSend(jsonObj jsonCommand, conn net.Conn) error {
	bs, err := json.Marshal(jsonObj)
	if err != nil {
		return err
	}

	delimiter := []byte("\r\n\r\n")
	b := append(bs, delimiter...)
	_, err = conn.Write(b)
	return err
}

func isTimeoutError(err error) bool {
	if err, ok := err.(net.Error); ok && err.Timeout() {
		return true
	}
	return false
}

func readLinesFromConn(conn net.Conn, lineScanner *bufio.Scanner, w *io.PipeWriter, timeout time.Duration) error {
	// so as to timeout if no line is recieved
	conn.SetReadDeadline(time.Now().Add(timeout * 10))
	for lineScanner.Scan() {
		w.Write(lineScanner.Bytes())
	}

	if err := lineScanner.Err(); err != nil {
		util.Log.Errorln(string(lineScanner.Bytes()))
	}
	return nil
}
