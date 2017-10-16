import nv from 'nvd3';
import d3 from 'd3';

import { addCommasToInt } from 'classes/util';
import { watchElementSizeChange } from 'charts/util';

// AbstractLineChart draws a line chart
class AbstractLineChart {
  // selector - selects an svg element
  // data - data of the chart
  constructor(selector, data) {
    this.selector = selector; // element selector on which the chart will be drawn
    this.data = data; // the chart data

    this.chart = null; // nvd3 chart
    this.chartData = null;  // d3 chart data on element

    this.cancelWatcher;
  }
  
  // -------------------------------------
  // methods expected to be implemented by 
  // the derived classes

  // return x value of data point
  // x (data)
  
  // return y value of data point
  // y (data)
  
  // (optional)
  // return html of the tooltip
  // tooltip(obj)
  
  // -------------------------------------
  // update the chart with new data
  update(data) {
    // see https://github.com/krispo/angular-nvd3/issues/287
    this.data.forEach((d, i) => {
        if (d.disabled)
          data[i].disabled = true;
    });

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
      let chart = nv.models.lineChart()
          .x((d) => this.x(d))
          .y((d) => this.y(d))
          .margin({top: marginTop});

      // Hour:Minutes:Seconds
      const f = d3.time.format('%X');
      chart.xAxis
          .tickFormat((t) => f(new Date(t)));

      // human readable format
      chart.yAxis
          .tickFormat((t) => {
            let v = Math.floor(t);
            return addCommasToInt(v);
          });

      // if all values are zero, nvd3 sets range of y axis to [-1, 1].
      // this sets the minimum range of y axis to be zero.
      chart.forceY([0, 10]);

      if (typeof(this.tooltip) === 'function') {
        chart.interactiveLayer.tooltip.contentGenerator((obj) => {
          return this.tooltip(obj);
        });
      }

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

export default AbstractLineChart;




