import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import bytes from 'bytes';

import BarChart from 'charts/BarChart';
import { nextNumber } from 'classes/util';

// ObjectSizeChart displays the object size chart
class ObjectSizeChart extends React.Component {
  constructor(props) {
    super(props);

    this.id = 'objsz_chart_' + nextNumber();
    this.barChart = null; // the bar chart
  }

  componentWillReceiveProps(nextProps) {
    let isEqual = true;

    const objsz = nextProps.objectSize;
    this.props.objectSize.forEach((p, i) => {
      const q = objsz[i];
      ['min', 'max', 'count'].forEach((v) => {
          if (p[v] !== q[v])
            isEqual = false;
      });
    });

    if (!isEqual) {
      this.barChart.destroy();
      this.drawChart(objsz);
    }
  }

  componentDidMount() {
    const objsz = this.props.objectSize;
    this.drawChart(objsz);
  }

  drawChart(objsz) {
    const data = this.toChartData(objsz);
    const chart = new BarChart('#' + this.id, data);
    chart.draw();

    this.barChart = chart;
  }

  toChartData(objsz) {
    const values = [];

    objsz.forEach((o) => {
      values.push({
        label: bytes(o.min) + ' - ' + bytes(o.max),
        value: o.count
      });
    });

    return [{
      key: 'Object Size',
      values: values,
    }];
  }

  render() {
    const height = this.props.height || 200;
    const style = { height: height };
    return (
      <div>
        <div className="row as-chart-title">
          Object Size
        </div>
        <div className="row">
          <svg style={style} id={this.id}> </svg>
        </div>
      </div>
    );
  }
}

ObjectSizeChart.PropTypes = {
  // the object size array
  objectSize: PropTypes.arrayOf(PropTypes.object),
  // (optional) height of the chart
  height: PropTypes.number,
};

export default ObjectSizeChart;


