package network

import (
	"net"

	"time"

	"github.com/citrusleaf/amc-agent/logmanager"
	"github.com/citrusleaf/amc-agent/util"
)

type Tcp Protocol

const writeTimeout = time.Minute

type amcTCPConn struct {
	net.Conn
}

func (conn *amcTCPConn) Write(p []byte) (int, error) {
	conn.SetWriteDeadline(time.Now().Add(writeTimeout))
	n, err := conn.Conn.Write(p)
	return n, err
}

func (tcp *Tcp) startListner(lm *logmanager.LogManager) error {
	host := net.JoinHostPort(tcp.ListnerIP, tcp.ListnerPort)
	listener, err := net.Listen("tcp", host)
	if err != nil {
		util.Log.Error("Failed to ListenTCP. Error : ", err.Error())
		return err
	}

	util.Log.Debug("TCP network listner created for %s", host)
	defer listener.Close()

	for {
		conn, err := listener.Accept()
		if err != nil {
			util.Log.Error("Failed to Accept connection. Error : ", err.Error())
			continue
		}
		util.Log.Info("New Connection Accepted :" + conn.RemoteAddr().String())

		var myTCPConn amcTCPConn
		myTCPConn.Conn = conn

		go func() {
			defer closeConnection(&myTCPConn)
			handleConnection(&myTCPConn, lm)
		}()
	}

}
