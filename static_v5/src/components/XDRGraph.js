import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import DirectedGraph from 'charts/DirectedGraph';
import { getOverview } from 'api/clusterConnections';
import { nextNumber } from 'classes/util';

// XDRGraph draws the xdr graph for the current connections.
class XDRGraph extends React.Component {
  constructor(props) {
    super();

    this.id = 'xdr_graph_' + nextNumber();

    // the overview of the clusters
    this.clusters = null;

    this.graph = null
  }

  componentDidMount() {
    getOverview()
      .then((response) => {
        this.clusters = response.data;
        this.drawGraph();
      })
      .catch((err) => {
        console.error(err);
      });
  }

  graphData() {
    const { clusters } = this;

    const nodes = [];
    const m = {}; // map of cluster key to index in nodes array
    for (let k in clusters) {
      const c = clusters[k];
      nodes.push({
        label: c.cluster_name || k
      });
      m[k] = nodes.length-1;
    }
      
    const links = [];
    for (let k in clusters) {
      const xdr = clusters[k].xdr_info;
      for (let to in xdr) {
        const namespaces = xdr[to].shipping_namespaces;
        links.push({
          source: m[k],
          target: m[to],
          label: namespaces.join(', ')
        });
      }
    }

    return {
      nodes: nodes,
      links: links,
    };
  }

  drawGraph() {
    if (this.graph)
      this.graphDestroy();
    else
      this.graph = new DirectedGraph('#'+this.id);

    const { nodes, links } = this.graphData();
    this.graph.setData(nodes, links);
    this.graph.draw();
  }

  componentWillUnmount() {
    this.graphDestroy();
  }

  graphDestroy() {
    if (this.graph)
      this.graph.destroy();
  }

  render() {
    const { id } = this;
    const height = this.props.height || 400;
    const style = { height: height };

    return (
      <div className="row">
        <svg className="col-xl-12" style={style} id={id}> </svg>
      </div>
    );
  }
}

XDRGraph.PropTypes = {
  // (optional) height of the chart
  height: PropTypes.number,
};

export default XDRGraph;
