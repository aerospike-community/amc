import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getLatency as getLatencyAPI } from 'api/node';
import LatencyCharts from 'components/LatencyCharts';

// NodeLatency provides an overview of the node latency
class NodeLatency extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      throughput: [],
      showChart: true,
    };

    this.getLatency = this.getLatency.bind(this);
  }

  redrawCharts() {
    this.setState({
      showChart: false
    });

    window.setTimeout(() => this.setState({showChart: true}), 250);
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID, nodeHost } = nextProps;

    if (this.props.clusterID === clusterID && this.props.nodeHost === nodeHost)
      return;

    this.redrawCharts();
  }

  getLatency(from, to) {
    const { clusterID, nodeHost } = this.props;
    const p = getLatencyAPI(clusterID, nodeHost, from, to)
                .then((r) => r[nodeHost].latency);
    return p;
  }
  
  render() {
    const { throughput, showChart } = this.state;
    const { nodeHost } = this.props;
    const title = `Node - ${nodeHost} Latency`;

    let charts = null;
    if (showChart)
      charts = <LatencyCharts getLatency={this.getLatency} title={title} />;

    return charts;
  }
}

NodeLatency.PropTypes = {
  clusterID: PropTypes.string.required,
  nodeHost: PropTypes.string.required,
};

export default NodeLatency;




