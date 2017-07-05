import nv from 'nvd3';
import d3 from 'd3';
import bytes from 'bytes';

import { watchElementSizeChange } from 'charts/util';

// AbstractStackedAreaChart is an abstract class that 
// draws a stacked area chart for a given time window
//
// selector - selects an svg element
class AbstractStackedAreaChart {
  constructor(selector, data, showLegend) {
    this.selector = selector; // element selector on which the chart will be drawn
    this.data = data; // the chart data
    this.showLegend = showLegend;

    this.chart = null; // nvd3 chart
    this.chartData = null;  // d3 chart data on element
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

  draw() {
    const marginTop = 40;

    nv.addGraph(() => {
      let chart = nv.models.stackedAreaChart()
          .x((d) => this.x(d))
          .y((d) => this.y(d))
          .useInteractiveGuideline(true)
          .showLegend(this.showLegend)
          .showControls(false)
          .margin({top: marginTop});

      // Hour:Minutes:Seconds
      const f = d3.time.format('%X');
      chart.xAxis
          .tickFormat((t) => f(new Date(t)));

      // if all values are zero, nvd3 sets range of y axis to [-1, 1].
      // this sets the minimum range of y axis to be zero.
      chart.forceY([0, 1000]);

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
      watchElementSizeChange(this.selector, () => chart.update());

      this.chart = chart;
      return chart;
    });
  }
}

export default AbstractStackedAreaChart;



