package network

import (
	"net"

	"github.com/citrusleaf/amc-agent/logmanager"
	"github.com/citrusleaf/amc-agent/util"
)

type Udp Protocol

func (udp *Udp) startListner(lm *logmanager.LogManager) error {
	host := net.JoinHostPort(udp.ListnerIP, udp.ListnerPort)
	udpAddr, err := net.ResolveUDPAddr("udp", host)
	if err != nil {
		util.Log.Error("Failed to resolve UDP Address. Error : ", err.Error())
		return err
	}

	for {
		conn, err := net.ListenUDP("udp", udpAddr)
		if err != nil {
			util.Log.Error("Failed to ListenUDP. Error : ", err.Error())
			return err
		}

		util.Log.Debug("UDP network listner created %s", host)

		handleConnection(conn, lm)
		// not only to clean up but also to close the writer to signal multiwriter
		closeConnection(conn)
	}
}
