import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import moment from 'moment';

import ThroughputChart from 'charts/ThroughputChart';
import { nextNumber } from 'classes/util';
import { getThroughput } from 'api/clusterConnections';

const types = {
  read_tps: 'Read',
  write_tps: 'Write',

  batch_read_tps: 'Batch',
  query_tps: 'Query',
  scan_tps: 'Scan',
  udf_tps: 'UDF',
};

// ClusterPerformance provides an overview of the cluster performance
class ClusterPerformance extends React.Component {
  constructor(props) {
    super(props);

    // map of 'chart type' to the throughput statistics
    this.throughput = {};
  }

  // process all the throughput
  initThroughput(throughput) {
    let data = {};
    for (const k in types) {
      const v = types[k];
      const tp = this.processThroughput(throughput[k]);
      data[v] = {
        name: v,
        throughput: tp
      };
    }
    this.throughput = data;
  }

  // process the throughput for a single type
  processThroughput(throughput) {
    let data = [];
    for (const nodeHost in throughput) {
      data.push({
        key: nodeHost,
        values: throughput[nodeHost]
      });
    }
    return data;
  }
  
  // get the id for the chart type
  id(type) {
    return 'cluster_performance_' + type;
  }

  // draw the charts
  draw() {
    for (const type in this.throughput) {
      const {throughput, name} = this.throughput[type];
      const id = '#' + this.id(type);
      const chart = new ThroughputChart(id, throughput, name);
      chart.draw();
    }
  }

  componentDidMount() {
    const { clusterID } = this.props;
    const from = moment().subtract(30, 'minutes').unix();
    const to = moment().unix();

    getThroughput(clusterID, from, to)
      .then((response) => {
        this.initThroughput(response.throughput);
        this.draw();
      })
      .catch((message) => console.error(message));
  }

  render() {
    const bigStyle = { 
      height: 350
    };
    const smStyle = {
      height: 200
    };

    return (
      <div>
        <div className="row">
          <div className="col-xl-12 as-section-header">
            Performance
          </div>
        </div>
        <div className="row">
          <svg style={bigStyle} id={this.id(types.read_tps)} className="col-xl-6"> </svg>
          <svg style={bigStyle} id={this.id(types.write_tps)} className="col-xl-6"> </svg>
        </div>
        <div className="row">
          <svg style={smStyle} id={this.id(types.query_tps)} className="col-xl-3"> </svg>
          <svg style={smStyle} id={this.id(types.batch_read_tps)} className="col-xl-3"> </svg>
          <svg style={smStyle} id={this.id(types.scan_tps)} className="col-xl-3"> </svg>
          <svg style={smStyle} id={this.id(types.udf_tps)} className="col-xl-3"> </svg>
        </div>
      </div>
    );
  }
}

ClusterPerformance.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterPerformance;



