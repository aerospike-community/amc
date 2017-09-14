package logfile

import (
	"context"
	"errors"
	"io"
	"os"
	"sync"
	"time"

	"github.com/citrusleaf/amc-agent/util"
)

const asLogTimeFormat = "Jan _2 2006 15:04:05 MST"

var mapInterval = time.Second * 60

var ErrEOFAfterCancel = errors.New("Context has been cancelled")

type LogFile struct {
	FilePath       string          // log file's name
	Index          map[int64]int64 // timestamp -> file pos
	lastPosIndexed int64
	buffer         []byte
	StartTime      int64        //starting time of the file
	EndTime        int64        //ending time of the file
	fileHandle     *os.File     // this may be nil
	bufferLock     sync.RWMutex // to synchronize access to the inner workings of the log file
	indexLock      sync.RWMutex
}

func NewLogFile(fPath string) (*LogFile, error) {
	// Implement this
	fileHandle, err := os.Open(fPath) // Opens in RDONLY mode
	if err != nil {
		util.Log.Error("Error in Opening file for Reading : " + err.Error())
		return nil, err
	}

	lf := &LogFile{
		fileHandle: fileHandle,
		FilePath:   fPath,
		Index:      make(map[int64]int64),
		buffer:     make([]byte, util.BytesBufferSize),
	}

	t, err := lf.ExtractTimeFromPos(0)
	if err != nil {
		util.Log.Error("The file does not start with a Timestamp.")
		return nil, err
	}

	lf.StartTime = t

	util.Log.Debug("LogFile Object created successfully for file : ", lf.FilePath)

	return lf, nil
}

// IndexFunc is for pre-processing the file and generating an indexMap.
// It takes to consideration the last position of index, so it just continues from the last position.
func (lf *LogFile) BuildIndex() error { //TODO: indexing on size

	lf.indexLock.Lock()
	defer lf.indexLock.Unlock()

	// For getting the current file size.
	currentFileSize, err := lf.currentFileSize()
	if err != nil {
		util.Log.Error("Failed to get the current size of file : " + lf.FilePath)
		return err
	}

	mapTime, err := lf.ExtractTimeFromPos(lf.lastPosIndexed) // mapTime is the last indexed time.
	if err != nil {
		util.Log.Error("Failed to extract the time from pos : ", lf.lastPosIndexed, " for file : ", lf.FilePath)
		return err
	}

	if lf.lastPosIndexed == 0 {
		lf.Index[mapTime] = lf.lastPosIndexed
	}

	for {
		//searching next mapInterval timestamp in file
		mapTime = mapTime + int64(mapInterval)

		mapIndex, err := lf.binarySearch(currentFileSize, lf.lastPosIndexed, mapTime)
		if err != nil {
			util.Log.Error("Failed to do binary search on file : " + lf.FilePath)
			return err
		}

		if mapIndex == indexNotFound {
			break
		}

		mapTime, err = lf.ExtractTimeFromPos(mapIndex)
		if err != nil {
			util.Log.Error("Failed to extract time from pos : ", mapIndex, " for file : ", lf.FilePath)
			return err
		}

		lf.Index[mapTime] = mapIndex
		lf.lastPosIndexed = mapIndex
	}

	endIndex, err := lf.getPosOfPrevTimestamp(0, currentFileSize-2)
	if err != nil {
		util.Log.Error("Failed to get the index of last timestamp for file : ", lf.FilePath)
		return err
	}

	endTime, err := lf.ExtractTimeFromPos(endIndex)
	if err != nil {
		util.Log.Error("Failed to extract the Ending Timestamp from pos : ", endIndex, " for file : ", lf.FilePath)
		return err
	}

	lf.EndTime = endTime

	util.Log.Debug("Index Built successfully for file : ", lf.FilePath)

	return nil
}

func (lf *LogFile) currentFileSize() (int64, error) {
	fi, err := lf.fileHandle.Stat()
	if err != nil {
		util.Log.Error("Failed to open file statistics. Error : " + err.Error())
		return 0, err
	}

	util.Log.Debug("Got the current size for file : ", lf.FilePath)

	return fi.Size(), nil
}

// This method is called only from the LogManager layer to push a fixed number of bytes to the passed writer.
func (lf *LogFile) ReadChunk(writer io.Writer, ctx context.Context, readFromStart bool) error {
	lf.bufferLock.Lock()
	defer lf.bufferLock.Unlock()
	defer util.Log.Debug("Exiting ReadChunk()")

	var offset int64

	if readFromStart {
		offset = 0
	} else {
		// Setting the offset to the end of the current file.
		startingOffset, err := lf.currentFileSize()
		if err != nil {
			util.Log.Error("Failed to get the current file Size")
			return err
		}
		offset = startingOffset
	}

	for {
		// Reading a fixed number of bytes from the file.
		n, err := lf.fileHandle.ReadAt(lf.buffer, offset)

		if n > 0 {
			// Pushing it to the writer only if someting new has been read
			util.Log.Debug("Pushing the following chunk to the writer : " + string(lf.buffer[:n]))
			n, err = writer.Write(lf.buffer[:n])
			if err != nil {
				util.Log.Error("Failed to push chunk to PipeWriter. Error : " + err.Error())
				return err
			}
			offset += int64(n)
		}

		if err != nil && err != io.EOF {
			util.Log.Error("Failed to read from the current file. Error : " + err.Error())
			return err
		}

		if err == io.EOF {
			select {
			case <-ctx.Done():
				util.Log.Error("Error : " + ErrEOFAfterCancel.Error())
				return ErrEOFAfterCancel
			default:
				if n == 0 {
					// sleep to avoid utilizing CPU
					time.Sleep(250 * time.Millisecond)
				}
				continue
			}
		}
	}
}

func (lf *LogFile) OverrideFileHandle(tailFileHandle *os.File) {
	lf.CloseFileHandle()
	lf.fileHandle = tailFileHandle
}

func (lf *LogFile) GetFileHandle() *os.File {
	return lf.fileHandle
}

func (lf *LogFile) CloseFileHandle() {
	lf.fileHandle.Close()
	lf.fileHandle = nil
}
