import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getThroughput as getThroughputAPI } from 'api/namespace';
import ThroughputCharts from 'components/ThroughputCharts';

// NamespaceThroughput provides an overview of the namespace throughput
class NamespaceThroughput extends React.Component {
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

    window.setTimeout(() => this.setState({showChart: true}), 250);
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID, nodeHost, namespaceName } = nextProps;

    if (this.props.clusterID === clusterID && this.props.nodeHost === nodeHost 
        && this.props.namespaceName === namespaceName)
      return;

    this.redrawCharts();
  }

  getThroughput(from, to) {
    const { clusterID, nodeHost, namespaceName } = this.props;
    return getThroughputAPI(clusterID, nodeHost, namespaceName, from, to);
  }
  
  render() {
    const { showChart } = this.state;
    const { namespaceName } = this.props;
    const title = `Namespace - ${namespaceName} Throughput`;

    let charts = null;
    if (showChart)
      charts = <ThroughputCharts getThroughput={this.getThroughput} title={title} />;

    return charts;
  }
}

NamespaceThroughput.PropTypes = {
  clusterID: PropTypes.string.required,
  nodeHost: PropTypes.string.required,
  namespaceName: PropTypes.string.required,
};

export default NamespaceThroughput;




