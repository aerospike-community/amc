import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getThroughput as getThroughputAPI } from 'api/clusterConnections';
import EntityThroughputCharts from 'components/EntityThroughputCharts';
import { ThroughputOperations as TPO } from 'charts/constants';

const Layout = [{
  operations: [TPO.UDF],
  height: 350,
}];

// UDFThroughput shows the throughput for the UDF operations 
// in a cluster
class UDFThroughput extends React.Component {
  constructor(props) {
    super(props);

    this.getThroughput = this.getThroughput.bind(this);
  }

  getThroughput(from, to) {
    const { clusterID } = this.props;
    return getThroughputAPI(clusterID, from, to);
  }
  
  render() {
    const title = 'UDF Throughput';
    return (
        <EntityThroughputCharts getThroughput={this.getThroughput} title={title} layout={Layout}/>
    );
  }
}

UDFThroughput.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default UDFThroughput;


