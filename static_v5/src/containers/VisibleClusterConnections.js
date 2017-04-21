import React from 'react';
import { connect } from 'react-redux';
import ClusterConnections from '../components/ClusterConnections';

const mapStateToProps = (state) => {
  return {
    displayAddCluster: state.clusters.displayAddConnection,
  };
};

const VisibleClusterConnections = connect(
  mapStateToProps,
)(ClusterConnections);

export default VisibleClusterConnections;

