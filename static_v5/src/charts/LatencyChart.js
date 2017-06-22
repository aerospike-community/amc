import nv from 'nvd3';
import d3 from 'd3';
import bytes from 'bytes';

import AbstractStackedAreaChart from 'charts/AbstractStackedAreaChart';
import { watchElementSizeChange } from 'charts/util';

// LatencyChart draws a chart for the latency
//
// selector - selects an svg element
// latency - [
//  { // each of the charts
//    key: '<1ms', // label name
//    values: [
//      { // each of the individual values
//        value: 12345,
//        timestamp: 1496807162727,
//      }, ...]
//  }, ...]
class LatencyChart extends AbstractStackedAreaChart {
  constructor(selector, latency) {
    super(selector, latency, true);
  }

  // x value of data point
  x(d) {
    return d.timestamp;
  }

  // y value of data point
  y(d) {
    return +d.value.toFixed(0);
  }
}

export default LatencyChart;


