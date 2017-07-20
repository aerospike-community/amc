import React from 'react';
import { connect } from 'react-redux';
import ClusterDashboard from 'components/cluster/ClusterDashboard';
import { CLUSTER_ACTIONS, NODE_ACTIONS }  from 'classes/entityActions';
import { selectViewForViewType, selectNode } from 'actions/currentView';
import { updateConnection } from 'actions/clusters';

const mapStateToProps = (state) => {
  const { clusterID, view } = state.currentView;
  const cluster = state.clusters.items.find((i) => i.id === clusterID);
  return {
    clusterID: clusterID,
    cluster: cluster,
    view: view
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onViewSelect: (view) => {
      dispatch(selectViewForViewType(view));
    },

    // select a node
    onSelectNode: (clusterID, nodeHost) => {
      dispatch(selectNode(clusterID, nodeHost, NODE_ACTIONS.View));
    }
  };
};

const VisibleClusterDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(ClusterDashboard);

export default VisibleClusterDashboard;


