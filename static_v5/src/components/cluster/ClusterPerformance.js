import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

// ClusterPerformance provides an overview of the cluster performance
class ClusterPerformance extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="row">
        <div className="col-12"> Performance statistics </div>
      </div>
    );
  }
}

ClusterPerformance.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterPerformance;



