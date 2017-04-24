import React from 'react';
import { connect } from 'react-redux';
import ClusterConnections from '../components/ClusterConnections';

const mapStateToProps = (state) => {
  const clusters = state.clusters;
  return {
    displayAddCluster: clusters.displayAddConnection,
    isFetching: clusters.isFetching,
  };
};

const VisibleClusterConnections = connect(
  mapStateToProps,
)(ClusterConnections);

export default VisibleClusterConnections;

