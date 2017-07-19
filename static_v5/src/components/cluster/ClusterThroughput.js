import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getThroughput as getThroughputAPI } from 'api/clusterConnections';
import { ThroughputGrouping } from 'charts/constants';
import EntityThroughputCharts from 'components/EntityThroughputCharts';

// ClusterThroughput provides an overview of the cluster performance
class ClusterThroughput extends React.Component {
  constructor(props) {
    super(props);

    this.getThroughput = this.getThroughput.bind(this);
  }

  getThroughput(from, to) {
    const { clusterID } = this.props;
    return getThroughputAPI(clusterID, from, to);
  }

  render() {
    const groupBy = ThroughputGrouping.ByTotal;
    return (
        <EntityThroughputCharts getThroughput={this.getThroughput} groupBy={groupBy}/>
    );
  }
}

ClusterThroughput.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default ClusterThroughput;


