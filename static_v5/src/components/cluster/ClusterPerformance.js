import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ThroughputChart from 'charts/ThroughputChart';
import { nextNumber } from 'classes/util';

// ClusterPerformance provides an overview of the cluster performance
class ClusterPerformance extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    for (let i = 0; i < 6; i++) {
      const id = 'cl_pf_' + i;
      const tc = new ThroughputChart('#' + id, null);
      tc.draw();
    }
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
          <svg style={bigStyle} id="cl_pf_0" className="col-6"> </svg>
          <svg style={bigStyle} id="cl_pf_1" className="col-6"> </svg>
        </div>
        <div className="row">
          <svg style={smStyle} id="cl_pf_2" className="col-3"> </svg>
          <svg style={smStyle} id="cl_pf_3" className="col-3"> </svg>
          <svg style={smStyle} id="cl_pf_4" className="col-3"> </svg>
          <svg style={smStyle} id="cl_pf_5" className="col-3"> </svg>
        </div>
      </div>
    );
  }
}

ClusterPerformance.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterPerformance;



