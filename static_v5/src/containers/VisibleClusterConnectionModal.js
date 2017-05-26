import React from 'react';
import { connect } from 'react-redux';
import AuthClusterConnectionModal from 'components/AuthClusterConnectionModal';
import { authenticateClusterConnection, displayAuthClusterConnection } from 'actions/clusters';

const mapStateToProps = (state) => {
  const { authConnection, items } = state.clusters;

  let clusterName = '';
  items.map((cluster) => {
    if (cluster.id === authConnection.clusterID)
      clusterName = cluster.name;
  });

  return {
    clusterName: clusterName,
    clusterID: authConnection.clusterID,
    inProgress: authConnection.isUpdating,
    hasFailed: authConnection.hasFailed,
    failureMessage: authConnection.failureMessage,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    authenticate: (id, name, password) => {
      dispatch(authenticateClusterConnection(id, name, password));
    },
    cancel: () => {
      dispatch(displayAuthClusterConnection(false));
    }
  };
}

const VisibleClusterConnectionModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(AuthClusterConnectionModal);

export default VisibleClusterConnectionModal;




