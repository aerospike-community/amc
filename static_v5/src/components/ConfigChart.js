import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import d3 from 'd3';

import { nextNumber, timeout, cancelTimeout } from 'classes/util';
import { POLL_INTERVAL } from 'classes/constants';
import { ConfigChart as ConfigChartClass } from 'charts/charts';

const MAX_NUM_POINTS = 20; // maximum number of points shown in the graph
const ColorFn = d3.scale.category10();

// ConfigChart draws the configuration charts in a time series
class ConfigChart extends React.Component {
  constructor(props) {
    super(props);

    this.id = 'config_chart_' + nextNumber();

    this.data = [];
    this.timeoutid = null;
    this.configChart = null;
  }

  componentWillUnmount() {
    if (this.configChart)
      this.configChart.destroy();

    this.stopPolling();
  }

  componentDidMount() {
    const chart = new ConfigChartClass('#'+this.id, this.data); 
    chart.draw();

    this.configChart = chart;
    this.pollConfigs();
  }

  stopPolling() {
    const id = this.timeoutid;
    if (id)
      cancelTimeout(id);
  }

  setData(config) {
    const timestamp = (new Date()).getTime();
    const data = this.data.slice(); // copy

    // create config point if not present
    this.props.configs.forEach((c) => {
      if (data.findIndex((d) => d.key === c.name) === -1) {
        data.push({
          key: c.name,
          values: [],
          color: ColorFn(data.length),
        });
      }
    });

    this.props.configs.forEach((c) => {
      const { key, name } = c;
      const v = config[key];

      // append value
      const series = data.find((d) => d.key === name);
      series.values.push({
        timestamp: timestamp,
        value: config[key],
      });

      // remove extra points
      const length = series.values.length;
      if (length > MAX_NUM_POINTS) {
        const n = length - MAX_NUM_POINTS;
        series.values.splice(0, n);
      }
    });

    this.data = data;
  }

  updateCharts() {
    this.configChart.update(this.data);
  }

  pollConfigs() {
    // don't use setInterval. 
    // see http://reallifejs.com/brainchunks/repeated-events-timeout-or-interval
    const updateData = () => {
      this.props.getConfig()
        .then((config) => {
          this.setData(config);
          this.updateCharts();

          this.timeoutid = timeout(updateData, POLL_INTERVAL);
      });
    };
    updateData();
  }
  
  render() {
    const { title } = this.props;
    const style = { height: 300 };

    return (
      <div>
        <div className="row as-chart-title"> {title} </div>
        <div className="row">
          <svg style={style} id={this.id}> </svg>
        </div>
      </div>
    );
  }
}

ConfigChart.PropTypes = {
  // function to fetch configs
  // getConfig returns a promise
  getConfig: PropTypes.func.isRequired,
  // title of the charts
  title: PropTypes.string,

  // the configs to display on the chart.
  //
  // These values will be extracted from the data returned by getConfig
  // [{
  //  key: 'max_ttl',
  //  name: 'Max TTL',
  // }, ...]
  configs: PropTypes.arrayOf(PropTypes.obj),
};

export default ConfigChart;




