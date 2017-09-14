package logfile

import (
	"bytes"
	"errors"
	"io"
	"time"

	"github.com/citrusleaf/amc-agent/util"
)

const indexNotFound = int64(-1)
const timeNotFound = int64(-1)
const timeStampSize = 24
const tempLineSize = 512

var ErrIndexNotFound = errors.New("Index Not Found")

func (lf *LogFile) ExtractTimeFromPos(pos int64) (int64, error) {

	twentyFourByteArray := make([]byte, timeStampSize)

	_, err := lf.fileHandle.ReadAt(twentyFourByteArray, pos)
	if err != nil && err != io.EOF {
		util.Log.Error("Failed to read from pos : ", pos, " in file : ", lf.FilePath)
		return timeNotFound, err
	}

	tTime, err := time.Parse(asLogTimeFormat, string(twentyFourByteArray))
	if err != nil {

		// Timestamp not found -> go to previous Timestamp
		pos, err = lf.getPosOfPrevTimestamp(0, pos-2)
		if err != nil {
			util.Log.Error("Failed to get pos of previous timestamp w.r.t pos : ", pos-2, " for file : ", lf.FilePath)
			return timeNotFound, err
		}

		tUnixNano, err := lf.ExtractTimeFromPos(pos)
		if err != nil {
			util.Log.Error("Failed to extract timestamp from pos : ", pos, " for file : "+lf.FilePath)
			return timeNotFound, err
		}

		return tUnixNano, nil
	}

	tUnixNano := tTime.UnixNano()

	return tUnixNano, nil
}

//go back to last \n to get the index of the starting point of current line
func (lf *LogFile) getPosOfPrevTimestamp(startingIndexLimit, pos int64) (int64, error) {

	lineByteArray := make([]byte, tempLineSize)
	timePos := int64(indexNotFound)

	//getting the last occurence of \n by recursively reading tempLineSize bytes each time
	for {

		if pos-tempLineSize+1 >= startingIndexLimit {
			pos = pos - tempLineSize + 1
		} else if (pos - startingIndexLimit + 1) >= 0 {
			lineByteArray = make([]byte, pos-startingIndexLimit+1)
			pos = startingIndexLimit
		} else {
			return indexNotFound, ErrIndexNotFound
		}

		_, err := lf.fileHandle.ReadAt(lineByteArray, int64(pos))
		if err != nil && err != io.EOF {
			util.Log.Error("Failed to read from pos : ", pos, " in file : ", lf.FilePath)
			return indexNotFound, err
		}

		timePos = int64(bytes.LastIndexByte(lineByteArray, '\n'))

		if timePos != indexNotFound {
			// '\n' found
			timePos = pos + timePos + 1
			return timePos, nil
		} else {
			if pos == startingIndexLimit {
				// \n not found and reached the first index
				timePos = startingIndexLimit
				return timePos, nil
			}
		}

	}
}

//find the index of nextline by finding \n taking a byte array of size tempLineSize recursively
func (lf *LogFile) giveStartingPosOfNextLine(pos int64) (int64, error) {

	lineByteArray := make([]byte, tempLineSize)
	posNextLine := int64(indexNotFound)

	for {
		n, err := lf.fileHandle.ReadAt(lineByteArray, int64(pos))
		if err != nil && err != io.EOF {
			util.Log.Error("Failed to read from pos : ", pos, " in file : ", lf.FilePath)
			return indexNotFound, err
		}

		posNextLine = int64(bytes.IndexByte(lineByteArray, '\n'))

		if posNextLine != indexNotFound {
			//\n found
			posNextLine = pos + posNextLine + 1
			return posNextLine, nil
		}

		pos += int64(n)
	}
}

func (lf *LogFile) binarySearch(fileSize, startingIndex, searchTime int64) (int64, error) {

	endIndex, err := lf.getPosOfPrevTimestamp(startingIndex, fileSize-2)
	if err != nil {
		util.Log.Error("Failed to get the index of ending timestamp for file : " + lf.FilePath)
		return indexNotFound, err
	}

	startingIndexTime, err := lf.ExtractTimeFromPos(startingIndex)
	if err != nil {
		util.Log.Error("Failed to extract the timestamp from index : ", startingIndex, " for file : "+lf.FilePath)
		return indexNotFound, err
	}

	endIndexTime, err := lf.ExtractTimeFromPos(endIndex)
	if err != nil {
		util.Log.Error("Failed to extract the ending timestamp for file : " + lf.FilePath)
		return indexNotFound, err
	}

	if endIndexTime < searchTime {
		return indexNotFound, nil
	}

	if searchTime < startingIndexTime {
		return startingIndex, nil
	}

	// Start of BS
	// exit the loop when startingIndex == endIndex
	for startingIndex < endIndex {

		midIndex := startingIndex + (endIndex-startingIndex)/2

		// Finding the starting index of current line where midIndex lies
		midIndex, err = lf.getPosOfPrevTimestamp(startingIndex, midIndex)
		if err != nil {
			util.Log.Error("Failed to get the mid index between pos : ", startingIndex, " and pos : ", endIndex, " for file : "+lf.FilePath)
			return indexNotFound, err
		}

		midTime, err := lf.ExtractTimeFromPos(midIndex)
		if err != nil {
			util.Log.Error("Failed to extract the middle timestamp from index : ", midIndex, " for file : "+lf.FilePath)
			return indexNotFound, err
		}

		if midTime < searchTime {
			//first index moves to next line
			startingIndex, err = lf.giveStartingPosOfNextLine(midIndex)
			if err != nil {
				util.Log.Error("Failed to get the position of next timestamp w.r.t. pos : ", midIndex, " for file : "+lf.FilePath)
				return indexNotFound, err
			}
		} else {
			endIndex = midIndex
		}

	}

	// util.Log.Debug("Binary Search finished successfully for timestamp : ", time.Unix(0, searchTime), " in file : ", lf.FilePath)

	return startingIndex, nil
}
