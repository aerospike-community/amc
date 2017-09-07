import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getThroughput as getThroughputAPI } from 'api/logicalNamespace';
import EntityThroughputCharts from 'components/EntityThroughputCharts';
import { timeout } from 'classes/util';

// LogicalNamespaceThroughput provides an overview of the namespace throughput
class LogicalNamespaceThroughput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showChart: true
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
    const { clusterID, namespaceName } = nextProps;

    if (this.props.clusterID === clusterID && this.props.namespaceName === namespaceName)
      return;

    this.redrawCharts();
  }

  getThroughput(from, to) {
    const { clusterID, namespaceName } = this.props;
    return getThroughputAPI(clusterID, namespaceName, from, to);
  }
  
  render() {
    const { showChart } = this.state;
    const { namespaceName } = this.props;

    let charts = null;
    if (showChart)
      charts = <EntityThroughputCharts getThroughput={this.getThroughput} />

    return charts;
  }
}

LogicalNamespaceThroughput.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  namespaceName: PropTypes.string.isRequired,
};

export default LogicalNamespaceThroughput;





