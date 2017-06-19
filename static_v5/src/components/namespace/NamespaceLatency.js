import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getLatency as getLatencyAPI } from 'api/namespace';
import LatencyCharts from 'components/LatencyCharts';

// NamespaceLatency provides an overview of the namespace latency
class NamespaceLatency extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
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
    const { clusterID, nodeHost, namespaceName } = nextProps;

    if (this.props.clusterID === clusterID && this.props.nodeHost === nodeHost 
        && this.props.namespaceName === namespaceName) {
      return;
    }

    this.redrawCharts();
  }

  getLatency(from, to) {
    const { clusterID, nodeHost, namespaceName } = this.props;
    const p = getLatencyAPI(clusterID, nodeHost, namespaceName, from, to)
                .then((r) => r[namespaceName].latency || []);
    return p;
  }
  
  render() {
    const { showChart } = this.state;
    const { namespaceName } = this.props;
    const title = `Namespace - ${namespaceName} Latency`;

    let charts = null;
    if (showChart)
      charts = <LatencyCharts getLatency={this.getLatency} title={title} />;

    return charts;
  }
}

NamespaceLatency.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
  namespaceName: PropTypes.string.isRequired,
};

export default NamespaceLatency;





