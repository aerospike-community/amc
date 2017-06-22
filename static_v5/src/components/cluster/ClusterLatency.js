import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import LatencyCharts from 'components/LatencyCharts';

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
                .then((r) => r.latency);
    return p;
  }
  
  render() {
    return (
        <h4> Latency </h4>
    );

    const { throughput, showChart } = this.state;
    const title = `Cluster Latency`;

    let charts = null;
    if (showChart)
      charts = <LatencyCharts getLatency={this.getLatency} title={title} />;

    return charts;
  }
}

ClusterLatency.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default ClusterLatency;





