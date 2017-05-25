import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

// ClusterNamespaces provides an overview of the cluster namespaces
class ClusterNamespaces extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="row">
        <div className="col-12"> Statistics of each namespace </div>
      </div>
    );
  }
}

ClusterNamespaces.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterNamespaces;



