import moment from 'moment';

import LatencyData from 'charts/LatencyData';
import { newLatencyChart } from 'charts/charts';
import { POLL_INTERVAL } from 'classes/constants';

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
  }

  // init fetches data and initializes the charts
  init() {
    const from = moment().subtract(10, 'minutes');
    const to = moment();

    this._fetchData(from, to, (data) => {
      this.latData.setData(data);
      this._setupCharts();
      this.keepInSync();
    });
  }

  // updateWindow updates the time window 
  // for the chart
  //
  // inSync - specifies whether the data should be polled 
  // and kept in sync with the current time
  updateWindow(from, to, inSync = false) {
    this.stopSync();

    this._fetchData(from, to, (data) => {
      this.latData.setData(data);
      this._updateCharts();
    });

    if (inSync)
      this.keepInSync();
  }

  // destroy cleans all the data, activities of the
  // LatencyCharts before being destroyed
  destroy() {
    this.stopSync();
  }

  // keepInSync keeps the data in sync with the current time
  keepInSync() {
    this.intervalID = window.setInterval(() => {

      let from = this.latData.latestTimestamp();
      from = from && moment(from+1000); // add a second
      const to = null;

      this._fetchData(from, to, (data) => {
        this.latData.updateWindow(data);
        this._updateCharts();
      });
    }, POLL_INTERVAL);
  }

  // stopSync stops keeping the data in sync with the current time
  stopSync() {
    window.clearInterval(this.intervalID);
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
      d3.select('#' + chart.id).selectAll('*').remove();
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

