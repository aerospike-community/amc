import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getLatency as getLatencyAPI } from 'api/node';
import EntityLatencyCharts from 'components/EntityLatencyCharts';
import { timeout } from 'classes/util';

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

    timeout(() => this.setState({showChart: true}), 250);
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

    let charts = null;
    if (showChart)
      charts = <EntityLatencyCharts getLatency={this.getLatency} />;

    return charts;
  }
}

NodeLatency.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
};

export default NodeLatency;




