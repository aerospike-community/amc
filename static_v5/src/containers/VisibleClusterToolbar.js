import React from 'react';
import { connect } from 'react-redux';
import ClusterToolbar from 'components/ClusterToolbar';
import { displayAddClusterConnection } from 'actions/clusters';
import { hideLeftPane } from 'actions/currentView';

const mapDispatchToProps = (dispatch) => {
  return {
    onToolClick: (item) => {
      // TODO add more based on toolbar
      if (item === 'addCluster')
        dispatch(displayAddClusterConnection(true));
      else if (item === 'hideEntityTree')
        dispatch(hideLeftPane());
      
    },
  };
};

const VisibleClusterToolbar = connect(
  null,
  mapDispatchToProps
)(ClusterToolbar);

export default VisibleClusterToolbar;

