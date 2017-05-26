import React from 'react';
import { connect } from 'react-redux';
import ClusterDashboard from 'components/cluster/ClusterDashboard';
import { toClusterPath } from 'classes/entityTree';
import { CLUSTER_ACTIONS }  from 'classes/constants';
import { selectPath } from 'actions/currentView';
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
    // change view to the cluster overview
    onViewClusterOverview: (clusterID) => {
      const path = toClusterPath(clusterID);
      dispatch(selectPath(path, CLUSTER_ACTIONS.Overview));
    },

    // update connection is a success
    onUpdateConnectionSuccess: (clusterID, connection) => {
      dispatch(updateConnection(clusterID, connection));

      const path = toClusterPath(clusterID);
      dispatch(selectPath(path, CLUSTER_ACTIONS.Overview));
    }
  };
};

const VisibleClusterDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(ClusterDashboard);

export default VisibleClusterDashboard;


