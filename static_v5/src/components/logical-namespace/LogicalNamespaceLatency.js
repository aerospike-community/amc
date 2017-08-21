import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getLatency as getLatencyAPI } from 'api/logicalNamespace';
import EntityLatencyCharts from 'components/EntityLatencyCharts';

// LogicalNamespaceLatency provides an overview of the namespace latency
class LogicalNamespaceLatency extends React.Component {
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
    const { clusterID, namespaceName } = nextProps;

    if (this.props.clusterID === clusterID && this.props.namespaceName === namespaceName) {
      return;
    }

    this.redrawCharts();
  }

  getLatency(from, to) {
    const { clusterID, namespaceName } = this.props;
    return getLatencyAPI(clusterID, namespaceName, from, to);
  }
  
  render() {
    const { showChart } = this.state;
    const { namespaceName } = this.props;

    let charts = null;
    if (showChart)
      charts = <EntityLatencyCharts getLatency={this.getLatency} />;

    return charts;
  }
}

LogicalNamespaceLatency.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  namespaceName: PropTypes.string.isRequired,
};

export default LogicalNamespaceLatency;






