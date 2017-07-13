import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getThroughput as getThroughputAPI } from 'api/clusterConnections';
import ClusterThroughputChart from 'charts/ClusterThroughputChart';
import ThroughputCharts from 'components/ThroughputCharts';

// ClusterThroughput provides an overview of the cluster performance
class ClusterThroughput extends React.Component {
  constructor(props) {
    super(props);

    this.getThroughput = this.getThroughput.bind(this);
  }

  getThroughput(from, to) {
    const { clusterID } = this.props;
    const p = getThroughputAPI(clusterID, from, to)
                .then((response) => {
                  let total = this.processThroughput(response.throughput);
                  return {
                    throughput: total
                  };
                });
    return p;
  }

  // convert throughput numbers to failed, successful
  processThroughput(throughput) {
    const types = Object.keys(throughput);
    let total = {};

    types.forEach((type) => {
      total[type] = processType(throughput[type]);
    });

    return total;


    function processType(tp) {
      const nspaces = Object.keys(tp);
      const total = {
        failed: [],
        successful: []
      };

      const len = tp[nspaces[0]].length;
      for (let i = 0; i <  len; i++) {
        let f = 0, s = 0, tstamp;
        nspaces.forEach((ns) => {
          const p = tp[ns][i];
          f += p.failed;
          s += p.successful;
          tstamp = p.timestamp;
        });

        total.failed.push({
          value: f,
          timestamp: tstamp
        });

        total.successful.push({
          value: f,
          timestamp: tstamp
        });
      }

      return total;
    }
  }
  
  render() {
    const newThroughputChart = (id, throughput, name) => new ClusterThroughputChart(id, throughput, name);

    return (
        <ThroughputCharts getThroughput={this.getThroughput} newThroughputChart={newThroughputChart} title="Throughput" />
    );
  }
}

ClusterThroughput.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default ClusterThroughput;


