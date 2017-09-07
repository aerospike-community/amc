import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getThroughput as getThroughputAPI } from 'api/node';
import EntityThroughputCharts from 'components/EntityThroughputCharts';
import { timeout } from 'classes/util';

// NodeThroughput provides an overview of the node throughput
class NodeThroughput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      throughput: [],
      showChart: true,
    };

    this.getThroughput = this.getThroughput.bind(this);
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

  getThroughput(from, to) {
    const { clusterID, nodeHost } = this.props;
    return getThroughputAPI(clusterID, nodeHost, from, to);
  }
  
  render() {
    const { throughput, showChart } = this.state;
    const { nodeHost } = this.props;

    let charts = null;
    if (showChart)
      charts = <EntityThroughputCharts getThroughput={this.getThroughput} />

    return charts;
  }
}

NodeThroughput.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
};

export default NodeThroughput;



