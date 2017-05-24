import * as d3 from 'd3';
import { nextNumber } from '../../classes/util';

const usedBytes = 'used-bytes';
const totalBytes = 'total-bytes';
const freeBytes = 'free-bytes';

// StorageChart draws a chart for the
// storage of the cluster
class StorageChart {
  constructor(selector, nodeDetails) {
    this.selector = selector; // element selector on which the chart will be drawn
    this.nodeDetails = nodeDetails; // the node details 

    this.tooltipID = 'storage_chart' + nextNumber();

    d3.select('body').append('div')
          .attr('id', this.tooltipID)
					.attr('class', 'as-d3-tooltip')        
					.style('opacity', 0);
  }
  
  // transform pie chart to center of the svg element
  _transform() {
    const elm = d3.select(this.selector);
    const height = (+elm.attr('height'))/2;
    const width = (+elm.attr('width'))/2;

    return `translate(${width}, ${height})`;
  }

  // create an arc that fits the svg element
  _arc() {
    const elm = d3.select(this.selector);
    const height = +elm.attr('height');
    const width = +elm.attr('width');
    const min = width < height ? width : height;

    return d3.arc()
            .innerRadius(min/5)
            .outerRadius(min/3);
  }

  draw() {
    let color = d3.schemeCategory20;
    let tooltip = d3.select('#' + this.tooltipID);
    let nodeDetails = this.nodeDetails;

    let data = [];
		for (const host in nodeDetails) {
      const node = nodeDetails[host];
      node.host = host;
      data.push(node);
    }

    let arc = this._arc();
    data = d3.pie()
				.value((d) => d[totalBytes])
				(data);

    d3.select(this.selector).selectAll('path')
        .data(data)
      .enter().append('path')
        .attr('d', arc)
        .attr('transform', this._transform())
        .style('fill', (d, i) => color[i%data.length])
        .on('mouseover', function(d) {		
          tooltip.transition()		
            .duration(200)		
            .style('opacity', .9);		
          tooltip.html(d.data.host + ' ' + d.value)	
            .style('left', (d3.event.pageX) + 'px')		
            .style('top', (d3.event.pageY - 28) + 'px');	
        })					
        .on('mouseout', function(d) {		
          tooltip.transition()		
            .duration(500)		
            .style('opacity', 0);	
        });
  }

  destroy() {
    d3.select('#' + this.tooltipID).remove();
  }
}

export default StorageChart;
