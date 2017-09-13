import moment from 'moment';

import LatencyData from 'charts/LatencyData';
import { newLatencyChart } from 'charts/charts';
import { POLL_INTERVAL } from 'classes/constants';
import { timeout, cancelTimeout } from 'classes/util';

// LatencyCharts draws the latency charts
export default class LatencyCharts {
  // fetchData(from, to) - function to fetch data
  // charts - the charts to draw.  [{operation: LatencyOperations.Read, id: 'read_chart_1234'}, ...]
  constructor(fetchData, charts) {
    this.charts = charts;
    this.chartInstances = {}; // map of latency Operation to chart instance

    this.fetchData = fetchData;
    this.intervalID = null;

    this.latData = new LatencyData();
    this.poll = false;
    this.timeoutid = null;
  }

  // init fetches data and initializes the charts
  init(lastXMinutes) {
    const from = moment().subtract(lastXMinutes, 'minutes');
    const to = moment();

    this._fetchData(from, to, (data) => {
      this.latData.setData(data);
      this._setupCharts();
      this.keepInSync(lastXMinutes);
    });
  }

  // updateWindow updates the time window 
  // for the chart
  //
  // inSync - specifies whether the data should be polled 
  // and kept in sync with the current time
  updateWindow(from, to, inSync = false, lastXMinutes) {
    this.stopSync();

    this._fetchData(from, to, (data) => {
      this.latData.setData(data);
      this._updateCharts();
    });

    if (inSync)
      this.keepInSync(lastXMinutes);
  }

  // destroy cleans all the data, activities of the
  // LatencyCharts before being destroyed
  destroy() {
    this.stopSync();
  }

  _timeWindow(lastXMinutes) {
    const from = this.latData.latestTimestamp();
    const xmins = moment().subtract(lastXMinutes, 'minutes');
    const set = {
      isUpdate: false,
      from: xmins
    };

    if (!from)
      return set;

    const f = moment(from);
    if (f.isBefore(xmins))
      return set;

    return {
      isUpdate: true,
      from: moment(from+1000), // add a second
    };
  }

  // keepInSync keeps the data in sync with the current time 
  keepInSync(lastXMinutes) {
    this.poll = true;

    // don't use setInterval. 
    // see http://reallifejs.com/brainchunks/repeated-events-timeout-or-interval
    const updateData = () => {
      const { from, isUpdate } = this._timeWindow(lastXMinutes);
      const to = null;

      this._fetchData(from, to, (data) => {
        if (isUpdate)
          this.latData.updateWindow(data);
        else
          this.latData.setData(data);

        this._updateCharts();

        if (this.poll)
          this.timeoutid = timeout(updateData, POLL_INTERVAL);
      });
    };
    this.timeoutid = timeout(updateData, POLL_INTERVAL);
  }

  // stopSync stops keeping the data in sync with the current time
  stopSync() {
    const id = this.timeoutid;
    if (id)
      cancelTimeout(id);

    this.poll = false;
  }

  // _setupCharts sets up the charts
  // data needs to be fetched before _setupCharts is called
  _setupCharts() {
    this.charts.forEach((chart) => {
      const { operation, id } = chart;
      const data = this.latData.chartData(operation);

      const c = newLatencyChart('#'+id, data);
      this.chartInstances[operation] = c;
      c.draw(data);
    });
  }
  
  // _removeCharts removes all the charts
  _removeCharts() {
    this.charts.forEach((chart) => {
      const { operation } = chart;
      const c = this.chartInstances[operation];
      c.destroy();
    });
  }

  // _updateCharts updates the charts with the new data
  _updateCharts() {
    this.charts.forEach((chart) => {
      const { operation } = chart;
      const data = this.latData.chartData(operation);

      const c = this.chartInstances[operation];
      c.update(data);
    });
  }

  // _fetchData fetches data in the time window
  _fetchData(from, to, callback) {
    const f = from && from.unix();
    const t = to && to.unix();

    this.fetchData(f, t)
      .then((latency) => {
        callback(latency);
      })
      .catch((msg) => {
        console.error(msg);
      });
  }
}

