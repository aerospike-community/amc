package network

import (
	"bytes"
	"context"
	"net"
	"time"

	command "github.com/citrusleaf/amc-agent/command"
	"github.com/citrusleaf/amc-agent/logmanager"
	"github.com/citrusleaf/amc-agent/util"
)

const (
	readTimeout      = time.Second
	messageDelimiter = "\r\n\r\n"
)

type Protocol struct {
	ListnerIP   string
	ListnerPort string
}

func (p *Protocol) String() string {
	return net.JoinHostPort(p.ListnerIP, p.ListnerPort)
}

type listnerIn interface {
	startListner(*logmanager.LogManager) error
}

func Listner(protocol listnerIn, lm *logmanager.LogManager) error {
	defer util.Log.Debug("Exiting Listner()")

	err := protocol.startListner(lm)
	if err != nil {
		util.Log.Error("Failed to start Listner")
		return err
	}

	return nil
}

func handleConnection(conn net.Conn, lm *logmanager.LogManager) {
	var buffer, pendingBuf bytes.Buffer
	var commandCancel context.CancelFunc
	testBuff := make([]byte, util.BytesBufferSize)

	for {
		conn.SetReadDeadline(time.Now().Add(readTimeout))

		// TODO: Think about when the UDP drops the delimiter
		n, err := conn.Read(testBuff)

		// Error can be timeout due to deadline, or any other error.
		// n can be greater than 0 but in this case we want to exit.
		if err != nil && !isTimeoutError(err) {
			util.Log.Error("Failed to Read from Connection. Error : ", err.Error())
			if commandCancel != nil {
				util.Log.Debug("Cancelling Context")
				commandCancel()
			}
			break
		}

		if n == 0 {
			continue
		}

		_, err = buffer.Write(testBuff[:n])
		if err != nil {
			util.Log.Error("Failed to write to Buffer. Error : ", err.Error())
			if commandCancel != nil {
				util.Log.Debug("Cancelling Context")
				commandCancel()
			}
			break
		}

		found, pos := delimiterIndex(buffer)

		if found {

			util.Log.Info("Preparing to process the new command : " + string(buffer.Bytes()[:pos]))

			cmd, err := command.NewCommand(conn, buffer.Bytes()[:pos])
			if err != nil {
				util.Log.Error("Failed to initiate the new command : " + string(buffer.Bytes()[:pos]))
			}

			commandCancel, err = cmd.HandleCommand(lm)
			if err != nil {
				util.Log.Error("Failed to process the new command : " + string(buffer.Bytes()[:pos]))
			}

			// TODO: think a bit more about this
			pendingBuf.Write(buffer.Bytes()[pos+len(messageDelimiter):])

			buffer.Reset()

			_, err = buffer.Write(pendingBuf.Bytes())
			if err != nil {
				util.Log.Error("Failed to write to Pending Buffer. Error : ", err.Error())
				if commandCancel != nil {
					util.Log.Debug("Cancelling Context")
					commandCancel()
				}
				break
			}

			pendingBuf.Reset()
		}
	}
}

func delimiterIndex(buf bytes.Buffer) (bool, int) {
	pos := bytes.Index(buf.Bytes(), []byte(messageDelimiter))
	if pos == -1 {
		return false, pos
	}
	return true, pos
}

func closeConnection(conn net.Conn) {
	util.Log.Info("Closing the connection : " + conn.RemoteAddr().String())
	conn.Close()
}

func isTimeoutError(err error) bool {
	if err, ok := err.(net.Error); ok && err.Timeout() {
		return true
	}
	return false
}
