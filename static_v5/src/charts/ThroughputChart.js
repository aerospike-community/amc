import nv from 'nvd3';
import d3 from 'd3';
import bytes from 'bytes';

import AbstractStackedAreaChart from 'charts/AbstractStackedAreaChart';
import { watchElementSizeChange } from 'charts/util';

// ThroughputChart draws a chart for the throughput
//
// selector - selects an svg element
// throughput - [
//  { // each of the charts
//    key: '127.0.0.1:3000', // label name
//    values: [
//      { // each of the individual values
//        successful: 12345,
//        failed: 435,
//        timestamp: 1496807162727,
//      }, ...]
//  }, ...]
class ThroughputChart extends AbstractStackedAreaChart {
  constructor(selector, throughput) {
    super(selector, throughput, true);
  }
  
  // x value of data point
  x(d) {
    return d.timestamp;
  }

  // y value of data point
  y(d) {
    return d.successful;
  }
}

export default ThroughputChart;

