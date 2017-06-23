import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getThroughput as getThroughputAPI } from 'api/clusterConnections';
import ThroughputCharts from 'components/ThroughputCharts';

const ChartPlacements = [{
  types: ['udf_tps'],
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
        <ThroughputCharts getThroughput={this.getThroughput} title={title} chartPlacements={ChartPlacements}/>
    );
  }
}

UDFThroughput.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default UDFThroughput;


