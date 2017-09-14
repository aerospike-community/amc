package logmanager

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"io"
	"time"

	"github.com/citrusleaf/amc-agent/logfile"
	"github.com/citrusleaf/amc-agent/util"
)

var errWriterNotFound = errors.New("Writer not found")
var errWriterAlreadyExists = errors.New("Writer already exists")
var errWriterPassedNil = errors.New("The passed writer is nil")

// This is called in a seperate goroutine to push lines to multiwriter.
func (lm *LogManager) lineMultiplexer() {

	defer util.Log.Debug("Exiting lineMultiplexer()")

	var tailPendingLine bytes.Buffer
	tailScanner := bufio.NewScanner(lm.tail.pipeReader)

	for tailScanner.Scan() {

		currentLine := append(tailScanner.Bytes(), '\n')
		util.Log.Debug("Read the following line from scanner : " + string(currentLine))

		if checkForStartingTimestamp(currentLine) {
			// If the current line begins with timestamp, push the pending line and add current line to pendingLine buffer.
			if tailPendingLine.Len() != 0 {
				util.Log.Debug("Pushing the following line to Writer : " + string(tailPendingLine.Bytes()))

				lm.customTailMultiwriter(tailPendingLine)
				tailPendingLine.Reset()

			}

			util.Log.Debug("Adding the following line to Pending Line : " + string(currentLine))
			_, err := tailPendingLine.Write(currentLine)
			if err != nil {
				util.Log.Error("Error while writing to the PendingLine : " + err.Error())
				return
			}

		} else {
			// If the current line does not begin with timestamp, just add current line to pendingLine buffer.
			util.Log.Debug("Adding the following line to Pending Line : " + string(currentLine))
			_, err := tailPendingLine.Write(currentLine)
			if err != nil {
				util.Log.Error("Error while writing to the PendingLine : " + err.Error())
				return
			}

		}

	}

	err := tailScanner.Err()
	if err != nil {
		util.Log.Error("Error while scanning lines : " + err.Error())
		return
	}

	if lm.tail.stopTail != nil {
		lm.tail.stopTail()
	}

	util.Log.Debug("I/O Pipe has been closed")

}

func (lm *LogManager) customTailMultiwriter(buffer bytes.Buffer) {
	lm.tail.writersLock.Lock()
	defer lm.tail.writersLock.Unlock()

	for writer := range lm.tail.writers {
		// Cannot use io.Copy() because it will drain buffer in first iteration itself. We need buffer for all writers.
		_, err := writer.Write(buffer.Bytes())
		if err != nil {

			util.Log.Error("Error while copying scanned line to Writer : ", writer, ". Error : ", err.Error())

			delete(lm.tail.writers, writer)
			util.Log.Info("Unregistered Tail Writer : ", writer)

			if len(lm.tail.writers) == 0 {
				if lm.tail.stopTail != nil {
					lm.tail.stopTail()
				}
			}

		}
	}
}

// This method starts Tailing for every first user.
func (lm *LogManager) startTail() {

	pipeReader, pipeWriter := io.Pipe()
	lm.tail.pipeReader = pipeReader

	// Call ReadBytes in logfile in a seperate go routine.
	go func() {
		defer pipeWriter.Close()

		// For the first time, we will tail from the current length of current file. So this is false for first time.
		tailFromStart := false

		for {
			lm.lock.Lock()
			tempCurrentlf := lm.currentlf
			lm.lock.Unlock()

			if tempCurrentlf == nil {
				continue
			}

			util.Log.Debug("Starting tail the file : " + tempCurrentlf.FilePath)

			ctx, cancel := context.WithCancel(context.Background())
			lm.tail.stopCurrentFileTail = cancel

			err := tempCurrentlf.ReadChunk(pipeWriter, ctx, tailFromStart)
			if err != logfile.ErrEOFAfterCancel {
				break
			}

			lm.tail.writersLock.Lock()
			lenWritersMap := len(lm.tail.writers)
			lm.tail.writersLock.Unlock()

			// Break if there are no more interested clients.
			if lenWritersMap == 0 {
				break
			}

			// From subsequent times, we will tail from the start of the current file. So this is true always, from the second time.
			tailFromStart = true
		}

	}()

	ctx, cancel := context.WithCancel(context.Background())
	lm.tail.stopTail = cancel

	go lm.waitForStopTail(ctx)
	go lm.lineMultiplexer()
}

// This method waits till the context is cancelled. Once cancelled, it stops tailing and exits.
func (lm *LogManager) waitForStopTail(ctx context.Context) {
	defer util.Log.Debug("Exiting waitForStoptail()")

	<-ctx.Done()
	util.Log.Info("Stopping Tail")

	lm.tail.pipeReader.Close()
	lm.tail.pipeReader = nil

	if lm.tail.stopCurrentFileTail != nil {
		lm.tail.stopCurrentFileTail()
		lm.tail.stopCurrentFileTail = nil
	}

	lm.tail.writersLock.Lock()
	lm.tail.writers = nil
	lm.tail.writersLock.Unlock()

	lm.tail.stopTail = nil

	return
}

func (lm *LogManager) RegisterTailWriter(w io.Writer) error {
	lm.tail.writersLock.Lock()
	defer lm.tail.writersLock.Unlock()

	if w == nil {
		util.Log.Error(errWriterPassedNil.Error())
		return errWriterPassedNil
	}

	if lm.tail.writers == nil {
		lm.tail.writers = make(map[io.Writer]bool)
	}

	// If the passed writer does not exist, add it to the writers slice.
	if _, found := lm.tail.writers[w]; !found {

		lm.tail.writers[w] = true
		util.Log.Info("Registered Tail Writer : ", w)

		if len(lm.tail.writers) == 1 {
			lm.startTail()
		}

		return nil
	}

	util.Log.Error(errWriterAlreadyExists.Error()+" : ", w)
	return errWriterAlreadyExists
}

func (lm *LogManager) UnregisterTailWriter(w io.Writer) error {
	lm.tail.writersLock.Lock()
	defer lm.tail.writersLock.Unlock()

	if w == nil {
		util.Log.Error(errWriterPassedNil.Error())
		return errWriterPassedNil
	}

	// If the passed writer exists, remove it from the writers slice.
	if _, found := lm.tail.writers[w]; found {

		delete(lm.tail.writers, w)
		util.Log.Info("Unregistered Tail Writer : ", w)

		if len(lm.tail.writers) == 0 {
			if lm.tail.stopTail != nil {
				lm.tail.stopTail()
			}
		}

		return nil
	}

	util.Log.Error(errWriterNotFound.Error()+" : ", w)
	return errWriterNotFound
}

func checkForStartingTimestamp(buf []byte) bool {
	if len(buf) < 24 {
		return false
	}
	_, err := time.Parse(util.AsLogTimeFormat, string(buf[:24]))
	if err != nil {
		return false
	}

	return true

}
