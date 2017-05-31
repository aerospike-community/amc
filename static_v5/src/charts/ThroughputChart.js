import nv from 'nvd3';
import d3 from 'd3';
import bytes from 'bytes';

import { watchElementSizeChange } from 'charts/util';

// ThroughputChart draws a chart for the throughput
// ThroughputChart assumes that the chart will be drawn on an svg element.
class ThroughputChart {
  constructor(selector, throughput, title = '') {
    this.selector = selector; // element selector on which the chart will be drawn
    this.throughput = throughput; // the throughput
    this.title = title;

    this.chart = null;
    this.chartData = null;
  }
  
  // update the chart with new data
  update(throughput) {
    this.throughput = throughput;
    this.chartData
      .datum(throughput)
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
    const nsuccess = 'successful';
    const nfailed = 'failed';
    const time = 'timestamp';

    nv.addGraph(() => {
      let chart = nv.models.stackedAreaChart()
          .x((d) => d[time])
          .y((d) => d[nsuccess])
          .useInteractiveGuideline(true)
          .showControls(false)
          .margin({top: marginTop});

      // Hour:Minutes:Seconds
      const f = d3.time.format('%X');
      chart.xAxis
          .tickFormat((t) => f(new Date(t)));

      // draw chart
      const data = this.throughput;
      const svg = d3.select(this.selector);
      this.chartData = svg.datum(data);
      this.chartData.call(chart);

      // title
      if (this.title) {
        svg.append('text')
          .attr('x', 10)
          .attr('y', marginTop/2)
          .style('font-size', '16px')
          .text(this.title);
      }

      // redraw on element size change
      watchElementSizeChange(this.selector, () => chart.update());

      this.chart = chart;
      return chart;
    });
  }
}

export default ThroughputChart;

