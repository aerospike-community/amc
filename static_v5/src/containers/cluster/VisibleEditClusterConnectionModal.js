import React from 'react';
import { connect } from 'react-redux';
import EditClusterConnectionModal from 'components/cluster/EditClusterConnectionModal';

import { toClusterPath } from 'classes/entityTree';
import { CLUSTER_ACTIONS, NODE_ACTIONS }  from 'classes/entityActions';
import { selectPath, selectNode } from 'actions/currentView';
import { updateConnection, displayViewClusterConnection } from 'actions/clusters';

const mapStateToProps = (state) => {
  const { clusterID } = state.clusters.viewConnection;
  const cluster = state.clusters.items.find((i) => i.id === clusterID);
  return {
    clusterID: clusterID,
    clusterName: cluster.name, 
    seeds: cluster.seeds,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onViewSelect: (clusterID, view) => {
      const path = toClusterPath(clusterID);
      dispatch(selectPath(path, view));
    },

    // update connection is a success
    onUpdateConnectionSuccess: (clusterID, connection) => {
      dispatch(updateConnection(clusterID, connection));
      dispatch(displayViewClusterConnection(false));
    },

    onCancel: () => {
      dispatch(displayViewClusterConnection(false));
    }
  };
};

const VisibleEditClusterConnectionModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(EditClusterConnectionModal);

export default VisibleEditClusterConnectionModal;



