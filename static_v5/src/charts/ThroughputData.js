import { ThroughputGrouping, ThroughputOperations as TPO } from 'charts/constants';

// map of throughput operation to the
// key in the data
const OperationKey = {
  [TPO.Batch]:     'batch_read_tps',
  [TPO.Query]:     'query_tps',
  [TPO.Read]:      'read_tps',
  [TPO.Scan]:      'scan_tps',
  [TPO.UDF]:       'udf_tps',
  [TPO.Write]:     'write_tps',
  [TPO.XDR_Write]: 'xdr_write_tps',
  [TPO.XDR_Read]:  'xdr_read_tps',
};

// ThroughputData handles all the functionality of
// storing, updating and processing throughput data.
export default class ThroughputData {
  constructor(data = null) {
    this.data = data;
  }

  // updateWindow adds data while maintaing
  // a sliding window of the data
  //
  // it removes data.length points from the beginning
  updateWindow(data) {
    for (const op in data) {
      for (const key in data[op]) {
        const val = data[op][key];
        if (val.length === 0)
          continue;

        // append values
        const orig = this.data[op][key];
        const origLen = orig.length;
        const last = orig.length === 0 ? null : orig[orig.length-1].timestamp;

        let nadded = 0;
        val.forEach((v) => {
          if (last === null || v.timestamp > last) {
            orig.push(v);
            nadded++;
          }
        });

        // slide the window
        if (nadded < origLen)
          orig.splice(0, nadded);
        else
          orig.splice(0, origLen);
      }
    }

    this.syncAll();
  }

  // synchronize all data
  syncAll() {
    Object.keys(this.data).forEach((op) => {
      this.sync(op);
    });
  }

  // synchronize data across all the namespaces
  sync(op) {
    let from, to;

    // find from, to across all namespaces
    for (const ns in this.data[op]) {
      const val = this.data[op][ns];

      const first = val[0];
      if (!from || first.timestamp > from)
        from = first.timestamp;

      const last = val[val.length-1];
      if (!to || last.timestamp < to)
        to = last.timestamp;
    }

    // keep only [from, to] window
    for (const ns in this.data[op]) {
      const val = this.data[op][ns];

      let i;
      for (i = 0; i < val.length; i++) {
        if (val[i].timestamp === from) 
          break;
      }
      val.splice(0, i)

      for (i = val.length-1; i >= 0; i--) {
        if (val[i].timestamp === to)
          break;
      }
      val.splice(i+1)
    }
  }

  // setData sets the data
  setData(data) {
    this.data = data;
    this.syncAll();
  }

  // earliestTimestamp returns the earliest timestamp
  // across the throughput data
  //
  // returns null if there is no data
  earliestTimestamp() {
    const d = this.data;
    if (d.length === 0)
      return null;

    return d[0].timestamp; 
  }

  // latestTimestamp returns the latest timestamp
  // across the throughput data
  //
  // returns null if there is no data
  latestTimestamp() {
    let keys = Object.keys(this.data);
    if (keys.length === 0)
      return null;

    const k1 = keys[0]; 

    keys = Object.keys(this.data[k1]);
    if (keys.length === 0)
      return null;

    const k2 = keys[0];

    const d = this.data[k1][k2];
    if (d.length === 0)
      return null;

    return d[d.length-1].timestamp; 
  }

  // chartData returns data for the operation as specified 
  // by the grouping that is consumable by the charts
  chartData(operation, grouping) {
    const k = OperationKey[operation];
    let opdata = this.data[k];

    if (grouping === ThroughputGrouping.ByTotal)
      opdata = toTotal(opdata);

    return toChartData(opdata);
  }
}

// toChartData converts the data to a form consumable by the charts
// data - pertains to data for a single operation
function toChartData(opdata) {
  let data = [];
  for (const key in opdata) {
    data.push({
      key: key,
      values: opdata[key],
    });
  }

  // HACK 
  // FIXME the API has to make sure that the values
  // returned are of the same length
  let shortestLen = Number.MAX_VALUE;
  data.forEach((d) => {
    shortestLen = Math.min(shortestLen, d.values.length);
  });

  data.forEach((d) => {
    d.values = d.values.slice(0, shortestLen);
  });

  return data;
}

// toTotal groups the data by success, failure
// data - pertains to data for a single operation
function toTotal(opdata) {
  const nspaces = Object.keys(opdata);
  const total = {
    failed: [],
    successful: []
  };

  const len = opdata[nspaces[0]].length;
  for (let i = 0; i <  len; i++) {
    let f = 0, s = 0, tstamp;
    nspaces.forEach((ns) => {
      const p = opdata[ns][i];
      f += p.failed;
      s += p.successful;
      tstamp = p.timestamp;
    });

    total.successful.push({
      value: s,
      timestamp: tstamp
    });

    total.failed.push({
      value: f,
      timestamp: tstamp
    });
  }

  return total;
}
