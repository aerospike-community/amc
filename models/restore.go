package models

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strconv"
	// "time"
	// "sync"

	log "github.com/Sirupsen/logrus"
	"golang.org/x/crypto/ssh"

	"github.com/citrusleaf/amc/common"
)

type Restore struct {
	*common.BackupRestore

	Threads             int
	MissingRecordsOnly  bool
	IgnoreGenerationNum bool

	cluster *Cluster
}

func (r *Restore) Execute() error {
	conf := r.cluster.observer.Config().AMC

	var authM ssh.AuthMethod
	if len(conf.BackupHostKeyFile) > 0 {
		authM = common.PublicKeyFile(conf.BackupHostKeyFile)
	} else if len(r.Username) > 0 {
		authM = ssh.Password(r.Password)
	} else {
		authM = common.SSHAgent()
	}

	// Make ssh session
	sshConfig := &ssh.ClientConfig{
		User: r.Username,
		Auth: []ssh.AuthMethod{
			authM,
		},
	}

	r.SSHClient = &common.SSHClient{
		Config: sshConfig,
		Host:   r.DestinationAddress,
		Port:   22,
	}

	// make command
	optionalArgs := ""
	if r.Threads != 20 {
		optionalArgs += fmt.Sprintf(" -t %d", r.Threads)
	}
	if r.MissingRecordsOnly {
		optionalArgs += " -u"
	}
	if r.IgnoreGenerationNum {
		optionalArgs += " -g"
	}

	if len(r.Namespace) > 0 {
		optionalArgs += " -n " + r.Namespace
	}

	if r.cluster.user != nil {
		optionalArgs += fmt.Sprintf(" -U%s -P%s", *r.cluster.user, *r.cluster.password)
	}

	node := r.cluster.RandomActiveNode()
	if node == nil {
		r.UpdateStatus(common.BackupStatusFailed)
		return errors.New("No active nodes found in the cluster.")
	}

	// try to connect to the remote address and run the command
	cmd := &common.SSHCommand{
		Path:   fmt.Sprintf("/bin/sh -c 'asrestore -h %s -p %d -d \"%s\" %s'", node.Host(), node.Port(), r.DestinationPath, optionalArgs),
		Env:    []string{},
		Stdin:  nil,
		Stdout: nil,
		Stderr: nil,
	}

	// Only log during development
	if !common.AMCIsProd() {
		log.Debugf("Running remote command for restore %s\n", cmd.Path)
	}

	session, err := r.SSHClient.Session(cmd)
	if err != nil {
		r.UpdateStatus(common.BackupStatusFailed)
		r.UpdateError(err.Error())
		log.Errorf("Restore command execute error: %s\n", err)
		return err
	}

	// connect to both outputs
	outReader, err := session.StdoutPipe()
	if err != nil {
		return err
	}

	errReader, err := session.StderrPipe()
	if err != nil {
		return err
	}

	output := io.MultiReader(outReader, errReader)

	// time.Sleep(1 * time.Second)
	if err := session.Start(cmd.Path); err != nil {
		r.UpdateStatus(common.BackupStatusFailed)
		r.UpdateError(err.Error())
		log.Errorf("Restore command execute error: %s\n", err)
		return err
	}

	// return here and continue updating progress percent asyncronously, otherwise return error
	go r.followProgress(session, output)

	return nil
}

func (r *Restore) followProgress(session *ssh.Session, reader io.Reader) {
	buf := bufio.NewReader(reader)
	defer session.Close()

	for {
		line, err := buf.ReadString('\n')

		log.Debugf("SSH Remote Command Output: %s", line)

		// Update Progress
		if pct := r.extractPercent(line); pct != nil {
			r.UpdateProgress(*pct)
		}

		// Update Error messages
		if errMsg := r.extractError(line); errMsg != nil {
			r.UpdateError(*errMsg)
		}

		if err != nil {
			if err != io.EOF {
				log.Errorf("Reading SSH output stream error: %s", err.Error())
				r.UpdateStatus(common.BackupStatusFailed)
				// r.UpdateError(err.Error())
				return
			}

			// EOF
			break
		}
	}

	r.UpdateProgress(100)
	r.UpdateStatus(common.BackupStatusFinished)
	return
}

var restoreProgressRgx = regexp.MustCompile(`.*\] (?P<percent>\d+)% complete.*`)

func (r *Restore) extractPercent(s string) *int {
	match := restoreProgressRgx.FindStringSubmatch(s)
	result := make(map[string]string)

	if len(match) == 0 {
		return nil
	}

	for i, name := range progressRgx.SubexpNames() {
		if i != 0 {
			result[name] = match[i]
		}
	}

	if val, exists := result["percent"]; exists {
		p, _ := strconv.Atoi(val)
		return &p
	}

	return nil
}

var restoreErrorRgx = regexp.MustCompile(`.*\[ERR\] \[\d+]\ (?P<err>.+)`)

func (r *Restore) extractError(s string) *string {
	match := restoreErrorRgx.FindStringSubmatch(s)
	result := make(map[string]string)

	if len(match) == 0 {
		return nil
	}

	for i, name := range errorRgx.SubexpNames() {
		if i != 0 {
			result[name] = match[i]
		}
	}

	if val, exists := result["err"]; exists {
		return &val
	}

	return nil
}
