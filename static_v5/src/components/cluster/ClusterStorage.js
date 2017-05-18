import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import 'bootstrap/dist/css/bootstrap.css';

// ClusterStorage provides an overview of the cluster storage
class ClusterStorage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="row">
        <div className="col-3"> RAM </div>
        <div className="col-3"> Disk </div>
        <div className="col-3"> </div>
        <div className="col-3"> </div>
      </div>
    );
  }
}

ClusterStorage.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterStorage;



