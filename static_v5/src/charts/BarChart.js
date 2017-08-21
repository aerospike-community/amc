import nv from 'nvd3';
import d3 from 'd3';

import { watchElementSizeChange } from 'charts/util';

// BarChart draws a bar chart
class BarChart {
  constructor(selector, data) {
    this.selector = selector; // element selector on which the chart will be drawn
    this.data = data; // the chart data

    this.chart = null; // nvd3 chart
    this.chartData = null;  // d3 chart data on element

    this.cancelWatcher;
  }
  
  // update the chart with new data
  update(data) {
    this.data = data;
    this.chartData
      .datum(data)
      .transition()
      .duration(250)
      .call(this.chart);
  }

  // redraw the chart
  redraw() {
    this.chart.redraw();
  }

  // destroy the chart.
  // after this call a new chart can be drawn on the
  // same svg element
  destroy() {
    // remove children of svg element
    d3.select(this.selector).selectAll('*').remove();

    // stop updating
    const fn = this.cancelWatcher;
    if (typeof(fn) === 'function')
      fn();
  }

  draw() {
    const marginTop = 40;

    nv.addGraph(() => {
	    let chart = nv.models.discreteBarChart()
        .x(function(d) { return d.label })
        .y(function(d) { return d.value })
        .staggerLabels(true)
        .showXAxis(false)
        .margin({top: marginTop});

      // remove decimals from y axis
      const f = d3.format('0.0f');
      chart.yAxis
          .tickFormat(f);

      chart.forceY([0, 100]);

      // draw chart
      const data = this.data;
      const svg = d3.select(this.selector);
      this.chartData = svg.datum(data);
      this.chartData.call(chart);

      // redraw on element size change
      this.cancelWatcher = watchElementSizeChange(this.selector, () => chart.update());

      this.chart = chart;
      return chart;
    });
  }
}

export default BarChart;




