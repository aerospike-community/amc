import React from 'react';
import { connect } from 'react-redux';

import ClusterToolbar from 'components/cluster/ClusterToolbar';
import { displayAddClusterConnection } from 'actions/clusters';
import { hideLeftPane, selectPhysicalView, selectLogicalView } from 'actions/currentView';
import { isLogicalView } from 'classes/util';

const mapStateToProps = (state) => {
  const { viewType } = state.currentView;
  return {
    isLogicalView: isLogicalView(viewType),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onToolClick: (item) => {
      if (item === 'addCluster')
        dispatch(displayAddClusterConnection(true));
      else if (item === 'hideEntityTree')
        dispatch(hideLeftPane());
      else if (item === 'toPhysicalView')
        dispatch(selectPhysicalView());
      else if (item === 'toLogicalView')
        dispatch(selectLogicalView());
    },
  };
};

const VisibleClusterToolbar = connect(
  mapStateToProps,
  mapDispatchToProps
)(ClusterToolbar);

export default VisibleClusterToolbar;

