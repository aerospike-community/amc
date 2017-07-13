import nv from 'nvd3';
import d3 from 'd3';
import bytes from 'bytes';
import moment from 'moment';

import AbstractStackedAreaChart from 'charts/AbstractStackedAreaChart';

// ClusterThroughputChart draws a chart for the throughput
//
// selector - selects an svg element
// throughput - [
//  { // each of the charts
//    key: '127.0.0.1:3000', // label name
//    values: [
//      { // each of the individual values
//        value: 12345,
//        timestamp: 1496807162727,
//      }, ...]
//  }, ...]
class ClusterThroughputChart extends AbstractStackedAreaChart {
  constructor(selector, throughput) {
    super(selector, throughput, true);
  }
  
  // x value of data point
  x(d) {
    return d.timestamp;
  }

  // y value of data point
  y(d) {
    return d.value;
  }
}

export default ClusterThroughputChart;


