import moment from 'moment';

import ThroughputData from 'charts/ThroughputData';
import { newThroughputChart } from 'charts/charts';
import { POLL_INTERVAL } from 'classes/constants';
import { ThroughputGrouping } from 'charts/constants';
import { timeout, cancelTimeout } from 'classes/util';

// ThroughputCharts draws the throughput charts
export default class ThroughputCharts {
  // fetchData(from, to) - function to fetch data
  // charts - the charts to draw.  [{operation: ThroughputOperations.Read, id: 'read_chart_1234'}, ...]
  // grouping - the grouping for all the charts
  constructor(fetchData, charts, grouping = ThroughputGrouping.ByTotal) {
    this.charts = charts;
    this.chartInstances = {}; // map of Throughput Operation to chart instance

    this.fetchData = fetchData;
    this.intervalID = null;

    this.grouping = grouping;

    this.tpdata = new ThroughputData();

    // poll for data
    this.poll = false;
    this.timeoutid = null;
  }

  // init fetches data and initializes the charts
  init(lastXMinutes) {
    const from = moment().subtract(10, 'minutes');
    const to = moment();

    this._fetchData(from, to, (data) => {
      this.tpdata.setData(data);
      this._setupCharts();
      this.keepInSync(lastXMinutes);
    });
  }

  // setGrouping sets the grouping in each of the charts
  setGrouping(grouping = ThroughputGrouping.ByNamespace) {
    if (grouping === this.grouping)
      return;

    this.grouping = grouping;
    // redraw charts
    this._removeCharts();
    this._setupCharts();
  }

  // updateWindow updates the time window 
  // for the chart
  //
  // inSync - specifies whether the data should be polled 
  // and kept in sync with the current time
  updateWindow(from, to, inSync = false, lastXMinutes) {
    this.stopSync();

    this._fetchData(from, to, (data) => {
      this.tpdata.setData(data);
      this._updateCharts();
    });

    if (inSync)
      this.keepInSync(lastXMinutes);
  }

  // destroy cleans all the data, activities of the
  // ThroughputCharts before being destroyed
  destroy() {
    this.stopSync();
  }

  _timeWindow(lastXMinutes) {
    const from = this.tpdata.latestTimestamp();
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
          this.tpdata.updateWindow(data);
        else
          this.tpdata.setData(data);

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
      const data = this.tpdata.chartData(operation, this.grouping);

      const c = newThroughputChart(this.grouping, '#'+id, data);
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
      const data = this.tpdata.chartData(operation, this.grouping);

      const c = this.chartInstances[operation];
      c.update(data);
    });
  }

  // _fetchData fetches data in the time window
  _fetchData(from, to, callback) {
    const f = from && from.unix();
    const t = to && to.unix();

    this.fetchData(f, t)
      .then((data) => {
        const { throughput } = data;
        callback(throughput);
      })
      .catch((msg) => {
        console.error(msg);
      });
  }
}
