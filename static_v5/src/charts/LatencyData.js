import { LatencyOperations as LO } from 'charts/constants';
import { replaceUnicode } from 'classes/util';

// map of throughput operation to the
// key in the data
const OperationKey = {
  [LO.Query]: 'query',
  [LO.Read]:  'reads',
  [LO.UDF]:   'udf',
  [LO.Write]: 'writes',
};

// LatencyData handles all the functionality of
// storing, updating and processing latency data.
export default class LatencyData {
  constructor(data = null) {
    this.data = data;
  }

  // updateWindow adds data while maintaing
  // a sliding window of the data
  //
  // it removes data.length points from the beginning
  updateWindow(data) {
    this.data = this.data.concat(data);
    this.data.splice(0, data.length);
  }

  // setData sets the data
  setData(data) {
    this.data = data;
  }

  // earliestTimestamp returns the earliest timestamp
  // across the throughput data
  //
  // returns null if there is no data
  earliestTimestamp() {
    const d = this.data;
    if (d.length === 0)
      return null;

    return getTime(d[0]);
  }

  // latestTimestamp returns the latest timestamp
  // across the throughput data
  //
  // returns null if there is no data
  latestTimestamp() {
    const d = this.data;
    if (d.length === 0)
      return null;

    return getTime(d[d.length-1]);
  }

  // chartData returns data for the operation that 
  // is consumable by the charts
  chartData(operation) {
    const op = OperationKey[operation];

    const data = {};
    this.data.forEach((lat) => {
      if (!lat.hasOwnProperty(op))
        return;

      const timestamp = lat[op].timestampUnix*1000;


      lat[op].data.forEach((d) => {
        for (let measure in d) {
          if (!data[measure]) {
            data[measure] = [];
          }

          data[measure].push({
            value: d[measure].value,
            timestamp: timestamp,
          });
        }
      });
    });

    // convert to array
    const arr = [];
    for (let measure in data) {
      arr.push({
        key: replaceUnicode(measure),
        values: data[measure]
      });
    }
    return arr;
  }
}

// getTime returns the time at the given point p
function getTime(p) {
  const k = Object.keys(p)[0];
  return p[k].timestampUnix*1000;
}
