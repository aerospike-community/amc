import React from 'react';
import { connect } from 'react-redux';
import ClusterToolbar from 'components/cluster/ClusterToolbar';
import { displayAddClusterConnection } from 'actions/clusters';
import { hideLeftPane, selectDeployCluster } from 'actions/currentView';

const mapDispatchToProps = (dispatch) => {
  return {
    onToolClick: (item) => {
      // TODO add more based on toolbar
      if (item === 'addCluster')
        dispatch(displayAddClusterConnection(true));
      else if (item === 'hideEntityTree')
        dispatch(hideLeftPane());
      else if (item === 'deployCluster')
        dispatch(selectDeployCluster());
    },
  };
};

const VisibleClusterToolbar = connect(
  null,
  mapDispatchToProps
)(ClusterToolbar);

export default VisibleClusterToolbar;

