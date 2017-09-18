import d3 from 'd3';

import { watchElementSizeChange } from 'charts/util';
import { nextNumber, svgDimensions } from 'classes/util';

// DirectedGraph draws a directed graph on the svg element.
export default class DirectedGraph {
  constructor(selector) {
    // svg element on which the chart will be drawn
    this.selector = selector; 
    this.svg = d3.select(selector);

    // nodes of the graph
    this.nodes = []; 
    // links with {source: i, target: j} where i, j are 
    // indexes into the nodes array
    this.links = []; 
                     
    // tooltip specific to this instance of the graph
    this.tooltip = null; 

    // 'color of node[i]' = colors[i]
    this.colors = [];

    // function to call to cancel the watcher on element size change
    this.cancelWatcher = null;
  }

  // Each of the nodes and links is assumed to have a label.
  // These labels are displayed on the node and link.
  setData(nodes, links) {
    this.nodes = nodes;
    this.links = links;
  }

  draw() {
    // remove any previously drawn graph
    this.destroy();

    this._initColors();
    this._initTooltip();

    this._drawNodes();
    this._drawLinks();
    this._drawLinkLabels();
    this._drawNodeLabels();

    this.cancelWatcher = watchElementSizeChange(this.selector, () => {
      this.draw();
    });
  }

  // destroy all the elements created to render this graph
  destroy() {
    d3.select(this.selector).selectAll('*').remove();

    // stop updating
    const fn = this.cancelWatcher;
    if (typeof(fn) === 'function')
      fn();

    if (this.tooltip)
      this.tooltip.remove();
  }

  _initColors() {
    const colors = [];
    const n = this.nodes.length;
    const fn = n > 10 ? d3.scale.category20() : d3.scale.category10();

    for (let i = 0; i < n; i++) {
      colors[i] = fn(i);
    }

    this.colors = colors;
  }

  _initTooltip() {
    if (this.tooltip)
      return;

    this.tooltip = d3.select('body')
      .append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .style("background", "orange");
  }

  // set up the (x, y) co-ordinates and the colors of the nodes
  _setupNodes() {
    const n = this.nodes.length;
    const w = this._width();
    const h = this._height();
    const m = 100; // margin of the graph
    const xy = coord(n, w, h, m);

    for (let i = 0; i < n; i++) {
      let node = this.nodes[i];
      node.x = xy[i].x;
      node.y = xy[i].y;
      node.color = this.colors[i];
    }
  }

  _drawNodes() {
    this._setupNodes();

    const { nodes, svg } = this;
    svg.selectAll('nodes_of_graph')
      .data(nodes)
    .enter().append('circle')
      .attr('cx', function(d) { return d.x })
      .attr('cy', function(d) { return d.y })
      .attr('r', 12)
      .attr('fill', function(d) { return d.color })
      ;
  }

  // set up the id, color of each of the links
  _setupLinks() {
    const n = nextNumber();
    this.links.forEach((link) => {
      const s = link.source,
            t = link.target;

      link.color = this.colors[s];
      link.id = `${n}_from_${s}_to_${t}`;
    });
  }

  _drawLinks() {
    this._setupLinks();

    const { svg, tooltip, nodes, links, colors } = this;
    const farrows = forwardArrows(svg, colors);
    const barrows = backwardArrows(svg, colors);

    svg.selectAll('links_of_graph')
      .data(links)
    .enter().append('path')
      .attr('d', function(d) {
        const s = nodes[d.source],
              t = nodes[d.target];

        return arc(s.x, s.y, t.x, t.y);
      })
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 3)
      .attr('fill', 'transparent')

      // id is needed to draw the labels on the paths
      .attr('id', (d) => d.id)

      // Link is always drawn from left to right.
      // The arrow is placed at the target end of the link, irrespective of the
      // direction of the link.
      .attr('marker-end', function(d) { 
        const s = nodes[d.source],
              t = nodes[d.target];
        
        // if the link is drawn from the source to the target
        if (s.x < t.x)
          return 'url(#' + farrows[d.color] + ')';
        else
          return null;
      })
      .attr('marker-start', function(d) { 
        const s = nodes[d.source],
              t = nodes[d.target];

        // if the link is drawn from the target to the source
        if (s.x >= t.x)
          return 'url(#' + barrows[d.color] + ')';
        else
          return null;
      })
      ;
  }

  _drawLinkLabels() {
    const { svg, nodes, links }  = this;

    // see https://stackoverflow.com/questions/8663844/add-text-label-onto-links-in-d3-force-directed-graph
    // https://developer.mozilla.org/en/docs/Web/SVG/Element/textPath
    svg.selectAll('link_labels')
      .data(links)
      .enter().append('text')
        .append('textPath')
          .text((d) => d.label || '')
          .attr('fill', (d) => d.color)
          .attr('xlink:href', (d) => '#'+d.id)
          .style('font-size', '20')

          // Link is always drawn from left to right.
          // The label is always placed at the target end of the link,
          // irrespective of the direction of the link.
          .attr('startOffset', function(d) {
            const s = nodes[d.source],
            t = nodes[d.target];

            if (s.x < t.x)
              return '90%';
            else
              return '10%';
          })
          .style('text-anchor', function(d) {
            const s = nodes[d.source],
            t = nodes[d.target];

            if (s.x < t.x)
              return 'end';
            else
              return 'start';
          })
          ;
  }

  _drawNodeLabels() {
    const { svg, nodes } = this;

    svg.selectAll('node_text')
      .data(nodes)
      .enter().append('text')
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y-15)
        .attr('fill', (d) => d.color)
        .text((d) => d.label || '')
        .style('text-anchor', 'middle')
        ;
  }

  _width() {
    const d = svgDimensions(this.selector);
    return d.width;
  }

  _height() {
    const d = svgDimensions(this.selector);
    return d.height;
  }
}

// length of a line
function length(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow((y2-y1), 2) + Math.pow((x2-x1), 2));
}

// return the path command to draw an arc between the two points
function arc(x1, y1, x2, y2) {
  // rx = ry = length/2 will be a straight line, 
  // any other value will be an arc.
  // higher the values of rx, ry the arc will be closer to a line.
  const rx = length(x1, y1, x2, y2);
  const ry = rx+rx/4;

  const x_axis_rotation = 0,
        large_arc_flag = 0;

  let sweep_flag, p;

  // Text on the arc is rendered in the direction the arc is drawn. Since text 
  // is read left to right, always draw the arc from the left to right 
  // direction.
  if (x1 < x2) {
    sweep_flag = 0;
    p = 'M ' + x1 + ' ' + y1 + ' ';
    p += ' A ' + rx + ' ' + ry;
    p += ' ' + x_axis_rotation;
    p += ' ' + large_arc_flag;
    p += ' ' + sweep_flag;
    p += ' ' + x2 + ' ' + y2;
  } else {
    sweep_flag = 1;
    p = 'M ' + x2 + ' ' + y2 + ' ';
    p += ' A ' + rx + ' ' + ry;
    p += ' ' + x_axis_rotation;
    p += ' ' + large_arc_flag;
    p += ' ' + sweep_flag;
    p += ' ' + x1 + ' ' + y1;
  }

  return p;
}

// Compute the coordinates of the nodes
// n - number of nodes
// width, height - dimensions of the canvas
// margin - margins of the graph
//
// return - an array of coordinates
function coord(n, width, height, margin) {
  let xy = [], // coordinates of nodes
      cx, cy,  // center of the circle
      rad,     // radius of the circle
      i, x, y;

  // Radius of circle
  rad = (Math.min(width, height) - margin)/2;

  // Calculate center of circle
  cx = rad + margin/2;
  cy = cx;

  // Equally distribute all the nodes on the circle
  for (i = 0; i < n; i++) {
    x = cx + rad * Math.cos(2*Math.PI/n * i);
    y = cy + rad * Math.sin(2*Math.PI/n * i);
    xy.push({
      x: x,
      y: y
    });
  }

  return xy;
}

// forwardArrows generates colors.length arrows pointing in the direction of 
// the line. Ex: --->
// arrows[colors[i]] = id of the arrow
function forwardArrows(svg, colors) {
  const viewBox = '0 -5 10 10';
  const path = 'M0,-5L10,0L0,5';
  const refX = 12;

  return arrows(svg, colors, viewBox, path, refX);
}

// forwardArrows generates colors.length arrows pointing in the opposite 
// direction of the line. Ex: ---<
// arrows[colors[i]] = id of the arrow
function backwardArrows(svg, colors) {
  const viewBox = '0 -5 10 10';
  const path = 'M10,-5L0,0L10,5';
  const refX = 0;

  return arrows(svg, colors, viewBox, path, refX);
}

// generate colors.length arrows
// arrows[colors[i]] = id of the arrow
function arrows(svg, colors, viewBox, path, refX) {
  // arrows see 
  // http://bl.ocks.org/tomgp/d59de83f771ca2b6f1d4
  // https://developer.mozilla.org/en/docs/Web/SVG/Element/marker           
	const defs = svg.append("defs");
  const arrows = {}; // map of color to id of the arrow
  const num = nextNumber();

  for (let i = 0; i < colors.length; i++) {
    const id = `${i}_arrow_${num}`;
    defs.append("marker")
        .attr({
          "id": id,
          "viewBox": viewBox,
          "refX": refX,
          "refY":0,
          "markerWidth":4,
          "markerHeight":4,
          // see https://www.w3.org/TR/svg-markers/#OrientAttribute
          //
          // A value of 'auto' indicates that the marker is oriented such that
          // its positive x-axis is pointing in the direction of the path at
          // the point it is placed.
          "orient":"auto",
          "fill": colors[i],
        })
        .append("path")
          .attr("d", path)
          .attr("class","arrowHead");

    arrows[colors[i]] = id;
  }

  return arrows;
}
