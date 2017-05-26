import nv from 'nvd3';
import d3 from 'd3';
import bytes from 'bytes';

// ThroughputChart draws a chart for the throughput
class ThroughputChart {
  constructor(selector, throughput) {
    this.selector = selector; // element selector on which the chart will be drawn
    this.throughput = throughput; // the throughput

    this.chart = null;
  }
  
  // transform the data to the throughput chart format
  // TODO can abstract these out and make it separate
  _data() {
    const nodes = ['172.17.0.4:3000', '172.17.0.5'];
    const now = new Date();

    let data = [];
    for (let i = 0; i < nodes.length; i++) {
      data.push({
        key: nodes[i],
        values: getDataPoints()
      });
    }
    return data;

    function getDataPoints() {
      let data = [];
      for (let i = 0; i < 100; i++) {
        const time = new Date(now.getTime() - i*10);
        data.push({
          time: time,
          value: Math.ceil(Math.random()*1000)
        });
      }
      data.reverse();
      return data;
    }
  }

  update(throughput) {
    this.throughput = throughput;
    // TODO redraw the chart
  }

  redraw() {
    this.chart.redraw();
  }

  draw() {
    nv.addGraph(() => {
      let chart = nv.models.stackedAreaChart()
          .x((d) => d.time)
          .y((d) => d.value)
          .useInteractiveGuideline(true)
          .showControls(false);

      const f = d3.time.format('%x');
      chart.xAxis
          .tickFormat((t) => f(new Date(t)));

      const data = this._data();
      d3.select(this.selector)
        .datum(data)
        .call(chart);

      nv.utils.windowResize(() => chart.update());

      this.chart = chart;
      return chart;
    });
  }
}

export default ThroughputChart;

