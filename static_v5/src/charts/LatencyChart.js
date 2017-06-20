import nv from 'nvd3';
import d3 from 'd3';
import bytes from 'bytes';

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
class LatencyChart {
  constructor(selector, latency) {
    this.selector = selector; // element selector on which the chart will be drawn
    this.latency = latency; // the latency

    this.chart = null; // nvd3 chart
    this.chartData = null;  // d3 chart data on element
  }
  
  // update the chart with new data
  update(latency) {
    this.latency = latency;
    this.chartData
      .datum(latency)
      .transition()
      .duration(250)
      .call(this.chart);
  }

  // redraw the chart
  redraw() {
    this.chart.redraw();
  }

  draw() {
    const marginTop = 40;
    const value = 'value';
    const time = 'timestamp';

    nv.addGraph(() => {
      let chart = nv.models.stackedAreaChart()
          .x((d) => d[time])
          .y((d) => +d[value].toFixed(0))
          .useInteractiveGuideline(true)
          .showLegend(true)
          .showControls(false)
          .margin({top: marginTop});

      // Hour:Minutes:Seconds
      const f = d3.time.format('%X');
      chart.xAxis
          .tickFormat((t) => f(new Date(t)));

      // if all values are zero, nvd3 sets range of y axis to [-1, 1].
      // this sets the minimum range of y axis to be zero.
      chart.forceY([0, 1000]);

      // draw chart
      const data = this.latency;
      const svg = d3.select(this.selector);
      this.chartData = svg.datum(data);
      this.chartData.call(chart);

      // redraw on element size change
      watchElementSizeChange(this.selector, () => chart.update());

      this.chart = chart;
      return chart;
    });
  }
}

export default LatencyChart;


