import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

// ClusterNodes provides an overview of the cluster nodes
class ClusterNodes extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="row">
        <div className="col-12"> Statistics of nodes </div>
      </div>
    );
  }
}

ClusterNodes.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterNodes;



