import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getThroughput as getThroughputAPI } from 'api/clusterConnections';
import ThroughputCharts from 'components/ThroughputCharts';

// ClusterThroughput provides an overview of the cluster performance
class ClusterThroughput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      throughput: [],
    };

    this.getThroughput = this.getThroughput.bind(this);
  }

  getThroughput(from, to) {
    const { clusterID } = this.props;
    return getThroughputAPI(clusterID, from, to);
  }
  
  render() {
    const { throughput } = this.state;
    return (
        <ThroughputCharts getThroughput={this.getThroughput} title="Throughput" />
    );
  }
}

ClusterThroughput.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterThroughput;


