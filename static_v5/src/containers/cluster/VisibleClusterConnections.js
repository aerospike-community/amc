import React from 'react';
import { connect } from 'react-redux';
import ClusterConnections from 'components/cluster/ClusterConnections';
import { initClusters as initializeClusters } from 'actions/clusters';

let CurrentView = null;

const mapStateToProps = (state) => {
  CurrentView = state.currentView;

  const clusters = state.clusters;
  return {
    displayAddCluster: clusters.newConnection.inProgress,
    displayAuthCluster: clusters.authConnection.inProgress,
    isFetching: clusters.isFetching,
    isInitialized: clusters.isInitialized,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    initClusters: () => {
      dispatch(initializeClusters(CurrentView));
    },
  };
}

const VisibleClusterConnections = connect(
  mapStateToProps,
  mapDispatchToProps
)(ClusterConnections);

export default VisibleClusterConnections;

