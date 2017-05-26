import nv from 'nvd3';
import d3 from 'd3';
import bytes from 'bytes';

const usedBytes = 'used-bytes';
const totalBytes = 'total-bytes';
const freeBytes = 'free-bytes';

// StorageChart draws a chart for the
// storage of the cluster
class StorageChart {
  constructor(selector, nodeDetails) {
    this.selector = selector; // element selector on which the chart will be drawn
    this.nodeDetails = nodeDetails; // the node details 
  }
  
  // transform the data to the pie chart format
  _data() {
    const { nodeDetails } = this;
    let data = [];
		for (const host in nodeDetails) {
      const node = Object.assign({}, nodeDetails[host], {
        host: host
      });
      data.push(node);
    }
    return data;
  }

  draw() {
    nv.addGraph(() => {
      let chart = nv.models.pieChart()
          .x((d) => d.host)
          .y((d) => d[totalBytes])
          .showLabels(false)
          .labelThreshold(0.05)
          .donut(true)
          .donutRatio(0.35);

      chart.tooltip
          .valueFormatter(bytes);

      const data = this._data();
      d3.select(this.selector)
        .datum(data)
        .call(chart);

      nv.utils.windowResize(() => chart.update());
      return chart;
    });
  }
}

export default StorageChart;
