package controllers

import (
	"bytes"
	"fmt"
	"net"

	"golang.org/x/crypto/ssh"
)

func runSSHCmd(ip string, port string, user string, pwd string, cmd string) (string, error) {

	config := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{
			ssh.Password(pwd),
		},
		HostKeyCallback: func(hostname string, remote net.Addr, key ssh.PublicKey) error {
			return nil
		},
	}

	client, err := ssh.Dial("tcp", fmt.Sprintf("%s:%s", ip, port), config)

	if err != nil {
		//panic("Failed to dial: " + err.Error())
		return "", err
	}

	session, err := client.NewSession()
	if err != nil {
		//panic("Failed to create session: " + err.Error())
		return "", err
	}
	defer session.Close()

	var b bytes.Buffer
	session.Stdout = &b
	if err := session.Run(cmd); err != nil {
		return "", err
	}
	return b.String(), nil
}
