import React from 'react';
import { connect } from 'react-redux';
import ClusterConnections from '../components/ClusterConnections';

const mapStateToProps = (state) => {
  const clusters = state.clusters;
  return {
    displayAddCluster: clusters.newConnection.inProgress,
    displayAuthCluster: clusters.authConnection.inProgress,
    isFetching: clusters.isFetching,
  };
};

const VisibleClusterConnections = connect(
  mapStateToProps,
)(ClusterConnections);

export default VisibleClusterConnections;

