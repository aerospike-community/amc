import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import bytes from 'bytes';

import BarChart from 'charts/BarChart';
import { nextNumber } from 'classes/util';

class TimeToLiveChart extends React.Component {
  constructor(props) {
    super(props);

    this.id = 'objsz_chart_' + nextNumber();
    this.barChart = null; // the bar chart
  }

  componentDidMount() {
    const data = this.toChartData();
    const chart = new BarChart('#' + this.id, data);
    chart.draw();

    this.barChart = chart;
  }

  toChartData() {
    const ttl = this.props.timeToLive;
    const values = [];

    ttl.forEach((o) => {
      values.push({
        label: `${o.min} - ${o.max} secs`,
        value: o.count
      });
    });

    return [{
      key: 'Time to live',
      values: values,
    }];
  }

  render() {
    const height = this.props.height || 200;
    const style = { height: height };
    return (
      <div>
        <div className="row as-chart-title">
          Time to live
        </div>
        <div className="row">
          <svg style={style} id={this.id}> </svg>
        </div>
      </div>
    );
  }
}

TimeToLiveChart.PropTypes = {
  // the time to live array
  timeToLive: PropTypes.arrayOf(PropTypes.object),
  // (optional) height of the chart
  height: PropTypes.number,
};

export default TimeToLiveChart;



