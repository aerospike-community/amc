package logmanager

import (
	"context"
	"errors"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	logfile "github.com/citrusleaf/amc-agent/logfile"
	"github.com/citrusleaf/amc-agent/util"
)

// Structure consisting of all vars related to Tailing.
type LMTail struct {
	writers             map[io.Writer]bool
	writersLock         sync.RWMutex
	pipeReader          *io.PipeReader
	stopTail            context.CancelFunc
	stopCurrentFileTail context.CancelFunc
}

type LogfilesMapValue struct {
	lf        *logfile.LogFile
	isPresent bool
}

type LogManager struct {
	logfiles      map[string]*LogfilesMapValue
	lock          sync.RWMutex
	currentlf     *logfile.LogFile
	currentlfPath string

	tail LMTail

	// For testing purpose
	latestDirRefreshedTime time.Time
}

var wakeUpInterval = time.Minute

var errNoFileAdded = errors.New("No files added")
var errNotADir = errors.New("Given directory path is not a directory")
var errNoContextPassed = errors.New("Context has not been passed")
var errNoDirPathPassed = errors.New("Directory Path has not been passed")
var errNoCurrentlfNamePassed = errors.New("Current File Name has not been passed")
var errInvalidCurrentlfName = errors.New("Invalid Current Logfile Name. Not a log file or path detected.")

var latestDirModTime = time.Time{}

func NewLogManager(ctx context.Context, dirPath string, currentlfName string) (*LogManager, error) {

	if ctx == nil {
		util.Log.Error(errNoContextPassed.Error())
		return nil, errNoContextPassed
	}
	if len(dirPath) == 0 {
		util.Log.Error(errNoDirPathPassed.Error())
		return nil, errNoDirPathPassed
	}
	if len(currentlfName) == 0 {
		util.Log.Error(errNoCurrentlfNamePassed.Error())
		return nil, errNoCurrentlfNamePassed
	}

	if !isValidFile(currentlfName) {
		util.Log.Error(errInvalidCurrentlfName.Error())
		return nil, errInvalidCurrentlfName
	}

	logManager := new(LogManager)

	logManager.logfiles = make(map[string]*LogfilesMapValue)
	logManager.currentlfPath = dirPath + currentlfName

	err := logManager.refreshDir(dirPath)
	if err != nil {
		util.Log.Error("Failed to add directory : " + dirPath)
		return nil, err
	}

	// If current file pointer does not point to any file object, there are no files added to this LM Object.
	if len(logManager.logfiles) == 0 {
		util.Log.Error(errNoFileAdded.Error())
		return nil, errNoFileAdded
	}

	go logManager.refreshIndex(ctx, dirPath)

	util.Log.Info("Log Manager successfully created.")
	return logManager, nil
}

func (lm *LogManager) refreshDir(dirPath string) error {

	dirStat, err := os.Stat(dirPath)
	if err != nil {
		util.Log.Error("Failed to read stats of given Folder. Error : " + err.Error())
		return err
	}

	if !dirStat.IsDir() {
		util.Log.Error(errNotADir.Error())
		return errNotADir
	}

	curDirModTime := dirStat.ModTime()
	_, currentlfEntryPresent := lm.logfiles[lm.currentlfPath]

	if !curDirModTime.After(latestDirModTime) && currentlfEntryPresent {
		util.Log.Debug("Directory not updated. Aborting refreshDir()")
		return nil
	}

	latestDirModTime = curDirModTime

	fileList, err := ioutil.ReadDir(dirPath)
	if err != nil {
		util.Log.Error("Failure in Reading directory : " + dirPath + ". Error : " + err.Error())
		return err
	}

	util.Log.Info("Following directory read successfully : " + dirPath)

	// Assume all files are stale, addLogfile will mark it present
	for _, logfile := range lm.logfiles {
		logfile.isPresent = false
	}

	// Add Log file which will also handle already existing file
	for _, fileInfo := range fileList {
		util.Log.Debug("Preparing to add file : " + dirPath + fileInfo.Name())
		lm.addLogfile(dirPath, fileInfo)
	}

	lm.removeStaleFiles()

	lm.updateCurrentFile()

	lm.latestDirRefreshedTime = time.Now()

	return nil
}

func (lm *LogManager) addLogfile(dirPath string, fileInfo os.FileInfo) {
	lm.lock.Lock()
	defer lm.lock.Unlock()

	filePath := dirPath + fileInfo.Name()

	if fileInfo.Size() == 0 {
		util.Log.Info("File has no content. Aborting addition of file : " + filePath)
		return
	}
	if fileInfo.IsDir() {
		util.Log.Info("File expected, but found a directory. Aborting addition of file : " + filePath)
		return
	}

	if !isValidFile(fileInfo.Name()) {
		util.Log.Info("File is zipped or has a non log extension. Aborting addition of file : " + filePath)
		return
	}

	// TODO: We will end up creating objects un-necessarily for the entries that we will skip
	// Doing 2 important things
	// 1. Skipping files without timestamp
	// 2. Finding the start time
	logFileObj, err := logfile.NewLogFile(filePath)
	if err != nil {
		util.Log.Error("Failed to add file : " + filePath)
		return
	}

	_, addedAlready := lm.logfiles[filePath]

	if filePath != lm.currentlfPath {
		if addedAlready {
			// Skip
			cleanUpLogFileObj(logFileObj)
			util.Log.Debug("Non-current file already added : " + filePath)
			lm.logfiles[filePath].isPresent = true
		} else {
			if lm.currentlf != nil && lm.currentlf.StartTime == logFileObj.StartTime {
				// Grab
				logFileObj = lm.grabOldCurrentFile(logFileObj)
				lm.addEntryToMap(logFileObj)
			} else {
				// Brand new entry
				lm.addEntryToMap(logFileObj)
			}
		}
	} else {
		if addedAlready {
			if lm.currentlf != nil && lm.currentlf.StartTime == logFileObj.StartTime {
				// Skip
				cleanUpLogFileObj(logFileObj)
				util.Log.Debug("No change in the current file : " + filePath)
				lm.logfiles[filePath].isPresent = true
			} else {
				// Replace entry
				lm.addEntryToMap(logFileObj)
			}
		} else {
			// Brand new entry
			lm.addEntryToMap(logFileObj)
		}
	}

	return
}

// For now, closing FD.
func cleanUpLogFileObj(logFileObj *logfile.LogFile) {
	util.Log.Debug("Cleaning up logFile Object for file : " + logFileObj.FilePath)
	logFileObj.CloseFileHandle()
}

func (lm *LogManager) grabOldCurrentFile(logFileObj *logfile.LogFile) *logfile.LogFile {
	// Log Rotation happened and this is the renamed file. Grab the index instead of rebuilding from scratch.
	util.Log.Debug("Preparing to grab old current file to file : " + logFileObj.FilePath)
	entryToGrab := lm.currentlf

	// Modify the actual object to be reused with new name
	entryToGrab.OverrideFileHandle(logFileObj.GetFileHandle())
	entryToGrab.FilePath = logFileObj.FilePath

	// Use this as new object and add it to the map
	logFileObj = entryToGrab

	// Delete the entry from map with the old name
	if lm.logfiles[lm.currentlfPath].lf == lm.currentlf {
		delete(lm.logfiles, lm.currentlfPath)
		lm.currentlf = nil
	}

	return logFileObj
}

func (lm *LogManager) addEntryToMap(logFileObj *logfile.LogFile) {
	// Besides adding any brand new files, it will also update the entry of the
	// ongoing current file with the new current file
	lm.logfiles[logFileObj.FilePath] = &LogfilesMapValue{
		lf:        logFileObj,
		isPresent: true,
	}

	util.Log.Info("Following file added successfully : " + logFileObj.FilePath)

	go func() {
		err := logFileObj.BuildIndex()

		if err != nil && logFileObj.FilePath != lm.currentlfPath {
			util.Log.Error("Failed to build index of file : " + logFileObj.FilePath)

			lm.lock.Lock()
			delete(lm.logfiles, logFileObj.FilePath)
			lm.lock.Unlock()

			util.Log.Info("Stopped tracking file : " + logFileObj.FilePath)
		}
	}()
}

func (lm *LogManager) removeStaleFiles() {
	lm.lock.Lock()
	defer lm.lock.Unlock()

	for filePath, logfile := range lm.logfiles {
		if !logfile.isPresent {
			delete(lm.logfiles, filePath)
			util.Log.Info("Stopped tracking file : " + filePath)

			if lm.currentlfPath == logfile.lf.FilePath {
				lm.currentlf = nil
			}
		}
	}
}

func (lm *LogManager) updateCurrentFile() {
	lm.lock.Lock()
	defer lm.lock.Unlock()

	templf := lm.logfiles[lm.currentlfPath]
	if templf != nil && lm.currentlf != templf.lf {

		lm.currentlf = templf.lf
		util.Log.Debug("Current File Updated to " + lm.currentlf.FilePath)

		if lm.tail.stopCurrentFileTail != nil {
			lm.tail.stopCurrentFileTail()
		}
	}

}

func isValidFile(fileName string) bool {
	indexOfFirstDot := strings.Index(fileName, ".")
	fileExt := fileName[indexOfFirstDot+1:]
	return strings.Contains(fileExt, "log") && !strings.Contains(fileExt, "gz") && !strings.Contains(fileExt, "bz") && (filepath.Dir(fileName) == ".")
}

func (lm *LogManager) refreshIndex(ctx context.Context, dirPath string) {

	//Building index on current file
	ticker := time.NewTicker(wakeUpInterval * time.Nanosecond)
	for {
		<-ticker.C
		select {

		case <-ctx.Done():
			// Close FDs
			for _, logfile := range lm.logfiles {
				cleanUpLogFileObj(logfile.lf)
			}

			// Release the pointer
			lm = nil
			return

		default:
			lm.refreshDir(dirPath)

			if lm.currentlf != nil {
				go lm.currentlf.BuildIndex()
			} else {
				util.Log.Debug("Current File Pointer points to nil")
			}
		}
	}
}
