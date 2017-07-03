import nv from 'nvd3';
import d3 from 'd3';
import bytes from 'bytes';

import { watchElementSizeChange } from 'charts/util';

const usedBytes = 'used-bytes';
const totalBytes = 'total-bytes';
const freeBytes = 'free-bytes';

// StorageChart draws a chart for the
// storage of the cluster
class StorageChart {
  constructor(selector, nodeDetails, title = '') {
    this.selector = selector; // element selector on which the chart will be drawn
    this.nodeDetails = nodeDetails; // the node details 
    this.title = title;
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
    const marginTop = 40;
    nv.addGraph(() => {
      let chart = nv.models.pieChart()
          .x((d) => d.host)
          .y((d) => d[totalBytes])
          .showLabels(false)
          .showLegend(false)
          .labelThreshold(0.05)
          .donut(true)
          .donutRatio(0.35);

      if (this.title)
        chart.title(this.title);

      chart.tooltip
          .valueFormatter(bytes);

      const data = this._data();
      const svg = d3.select(this.selector);

      svg.datum(data)
        .call(chart);

      // redraw on element size change
      watchElementSizeChange(this.selector, () => chart.update());

      return chart;
    });
  }
}

export default StorageChart;
