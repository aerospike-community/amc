import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ClusterStorage from './ClusterStorage';
import ClusterPerformance from './ClusterPerformance';
import ClusterNodes from './ClusterNodes';
import ClusterNamespaces from './ClusterNamespaces';

// ClusterOverview provides an overview of the cluster
class ClusterOverview extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { clusterID }  = this.props;
    return (
      <div>
        <ClusterStorage     clusterID={clusterID} />
        <ClusterPerformance clusterID={clusterID} />
        <ClusterNodes       clusterID={clusterID} />
        <ClusterNamespaces  clusterID={clusterID} />
      </div>
    );
  }
}

ClusterOverview.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterOverview;


