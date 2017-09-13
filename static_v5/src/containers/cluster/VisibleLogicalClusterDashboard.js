import React from 'react';
import { connect } from 'react-redux';
import LogicalClusterDashboard from 'components/cluster/LogicalClusterDashboard';
import { LOGICAL_CLUSTER_ACTIONS }  from 'classes/entityActions';
import { selectViewForViewType } from 'actions/currentView';

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
  };
};

const VisibleLogicalClusterDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(LogicalClusterDashboard);

export default VisibleLogicalClusterDashboard;



