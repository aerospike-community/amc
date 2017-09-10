package models

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strconv"

	log "github.com/Sirupsen/logrus"
	"golang.org/x/crypto/ssh"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
)

type Backup struct {
	*common.BackupRestore

	cluster *Cluster
}

func GetBackup(id, clusterId string) (*Backup, error) {
	br, err := common.GetBackupRestore(id, clusterId, common.BackupRestoreTypeBackup)
	if err != nil {
		return nil, err
	}

	return &Backup{br, nil}, nil
}

func SuccessfulBackups(clusterId string) ([]*Backup, error) {
	backups, err := common.SuccessfulBackups(clusterId)
	if err != nil {
		return nil, err
	}

	res := make([]*Backup, 0, len(backups))
	for _, br := range backups {
		res = append(res, &Backup{br, nil})
	}

	return res, nil
}

func (b *Backup) ToMedia() *app.AerospikeAmcBackupResponse {
	var fd *int
	if b.Finished.Valid() {
		tmp := (int(*b.Finished.UnixNano()) / 1000)
		fd = &tmp
	}

	return &app.AerospikeAmcBackupResponse{
		ID:                       b.Id,
		ClusterID:                b.ClusterId,
		Namespace:                b.Namespace,
		DestinationAddress:       b.DestinationAddress,
		DestinationPath:          b.DestinationPath,
		Sets:                     &b.Sets.String,
		MetadataOnly:             b.MetadataOnly,
		TerminateOnClusterChange: b.TerminateOnClusterChange,
		ScanPriority:             b.ScanPriority,
		CreateDate:               int(b.Created.UnixNano() / 1000),
		FinishDate:               fd,
		Status:                   string(b.Status),
		Progress:                 b.Progress,
		Error:                    &b.Error,
	}
}

func (b *Backup) Execute() error {
	conf := b.cluster.observer.Config().AMC

	var authM ssh.AuthMethod
	if len(conf.BackupHostKeyFile) > 0 {
		authM = common.PublicKeyFile(conf.BackupHostKeyFile)
	} else if len(b.Username) > 0 {
		authM = ssh.Password(b.Password)
	} else {
		authM = common.SSHAgent()
	}

	// Make ssh session
	sshConfig := &ssh.ClientConfig{
		User: b.Username,
		Auth: []ssh.AuthMethod{
			authM,
		},
	}

	b.SSHClient = &common.SSHClient{
		Config: sshConfig,
		Host:   b.DestinationAddress,
		Port:   22,
	}

	// make command
	optionalArgs := ""
	if b.Sets.String != "ALL" && b.Sets.String != "" {
		optionalArgs += " -s " + b.Sets.String
	}
	if b.MetadataOnly {
		optionalArgs += " -x "
	}
	if b.TerminateOnClusterChange {
		optionalArgs += " -c "
	}
	if b.ScanPriority != 2 {
		optionalArgs += fmt.Sprintf(" -f %d ", b.ScanPriority)
	}
	if b.cluster.User() != nil {
		optionalArgs += fmt.Sprintf(" -U%s -P%s", *b.cluster.User(), *b.cluster.Password())
	}

	node := b.cluster.RandomActiveNode()
	if node == nil {
		b.UpdateStatus(common.BackupStatusFailed)
		return errors.New("No active nodes found in the cluster.")
	}

	// try to connect to the remote address and run the command
	b.DestinationPath += fmt.Sprintf("/backup_%s_%s", b.Namespace, b.Created.Format("2006-01-02_15:04:05"))
	cmd := &common.SSHCommand{
		Path:   fmt.Sprintf("/bin/sh -c 'mkdir -p \"%s\" && asbackup -h %s -p %d -d \"%s\" -n %s %s'", b.DestinationPath, node.Host(), node.Port(), b.DestinationPath, b.Namespace, optionalArgs),
		Env:    []string{},
		Stdin:  nil,
		Stdout: nil,
		Stderr: nil,
	}

	// Only log during development
	if !common.AMCIsProd() {
		log.Debugf("Running remote command for backup %s\n", cmd.Path)
	}

	session, err := b.SSHClient.Session(cmd)
	if err != nil {
		b.UpdateStatus(common.BackupStatusFailed)
		b.UpdateError(err.Error())
		log.Errorf("Backup command execute error: %s\n", err)
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

	if err := session.Start(cmd.Path); err != nil {
		b.UpdateStatus(common.BackupStatusFailed)
		b.UpdateError(err.Error())
		log.Errorf("Backup command execute error: %s\n", err)
		return err
	}

	// return here and continue updating progress percent asyncronously, otherwise return error
	go b.followProgress(session, output)

	return nil
}

func (b *Backup) followProgress(session *ssh.Session, reader io.Reader) {
	buf := bufio.NewReader(reader)
	defer session.Close()

	for {
		line, err := buf.ReadString('\n')

		// Update Progress
		if pct := b.extractPercent(line); pct != nil {
			b.UpdateProgress(*pct)
		}

		// Update Error messages
		if errMsg := b.extractError(line); errMsg != nil {
			b.UpdateError(*errMsg)
		}

		if err != nil {
			if err != io.EOF {
				log.Errorf("Reading SSH output stream error: %s", err.Error())
				b.UpdateStatus(common.BackupStatusFailed)
				// b.UpdateError(err.Error())
				return
			} else {
				break
			}
		}
	}

	b.UpdateProgress(100)
	b.UpdateStatus(common.BackupStatusFinished)
	return
}

// func (b *Backup) Notify() {
// 	messages := common.Info{
// 		"red":   "Backup %s Failed.",
// 		"green": "Backup %s finished successfully.",
// 	}

// 	alert := common.Alert{
// 		Id:          time.Now().UnixNano(),
// 		ClusterId:   n.cluster.Id(),
// 		Type:        common.AlertTypeNodeFileDescriptors,
// 		NodeAddress: n.Address(),
// 		Desc:        fmt.Sprintf(msg, n.Address()),
// 		Created:     time.Now(),
// 		LastOccured: time.Now(),
// 		Status:      status,
// 	}

// 	n.alerts.Register(&alert)

// 	n.alertStates["fdAlert"] = string(fdAlert)
// }

var progressRgx = regexp.MustCompile(`.*\] (?P<percent>\d+)% complete.*`)

func (b *Backup) extractPercent(s string) *int {
	match := progressRgx.FindStringSubmatch(s)
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

var errorRgx = regexp.MustCompile(`.*\[ERR\] \[\d+]\ (?P<err>.+)`)

func (b *Backup) extractError(s string) *string {
	match := errorRgx.FindStringSubmatch(s)
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
