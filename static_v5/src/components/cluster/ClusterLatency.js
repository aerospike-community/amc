import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import LatencyCharts from 'components/LatencyCharts';
import { getLatency as getLatencyAPI } from 'api/clusterConnections';

// ClusterLatency provides an overview of the cluster latency
class ClusterLatency extends React.Component {
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
    const { clusterID } = nextProps;

    if (this.props.clusterID === clusterID)
      return;

    this.redrawCharts();
  }

  getLatency(from, to) {
    const { clusterID } = this.props;
    const p = getLatencyAPI(clusterID, from, to)
                .then((r) => {
                  // FIXME when the API changes
                  // right now showing any node's latency
                  let nodes = Object.keys(r);
                  if (nodes.length > 0)
                    return r[nodes[0]].latency
                  return {};
                });
    return p;
  }
  
  render() {
    const title = `Cluster Latency`;

    let charts = null;
    if (this.state.showChart)
      charts = <LatencyCharts getLatency={this.getLatency} title={title} />;

    return charts;
  }
}

ClusterLatency.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default ClusterLatency;





