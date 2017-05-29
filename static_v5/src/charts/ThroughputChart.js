import nv from 'nvd3';
import d3 from 'd3';
import bytes from 'bytes';

// ThroughputChart draws a chart for the throughput
class ThroughputChart {
  constructor(selector, throughput, title = 'Throughput') {
    this.selector = selector; // element selector on which the chart will be drawn
    this.throughput = throughput; // the throughput
    this.title = title;

    this.chart = null;
    this.chartData = null;
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
    // TODO get data from throughput
    const data = this._data();
    this.chartData
      .datum(data)
      .transition()
      .duration(250)
      .call(this.chart);
  }

  redraw() {
    this.chart.redraw();
  }

  draw() {
    const marginTop = 40;
    nv.addGraph(() => {
      let chart = nv.models.stackedAreaChart()
          .x((d) => d.time)
          .y((d) => d.value)
          .useInteractiveGuideline(true)
          .showControls(false)
          .margin({top: marginTop});

      const f = d3.time.format('%x');
      chart.xAxis
          .tickFormat((t) => f(new Date(t)));

      const data = this._data();
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

      nv.utils.windowResize(() => chart.update());

      this.chart = chart;
      return chart;
    });
  }
}

export default ThroughputChart;

