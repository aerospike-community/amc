import React from 'react';
import { connect } from 'react-redux';
import ClusterToolbar from '../components/ClusterToolbar';
import { displayAddClusterConnection } from '../actions/clusters';

const mapDispatchToProps = (dispatch) => {
  return {
    onItemClick: (item) => {
      // TODO add more based on toolbar
      if (true && item === 'addCluster') {
        dispatch(displayAddClusterConnection(true));
      }
    },
  };
};

const VisibleClusterToolbar = connect(
  null,
  mapDispatchToProps
)(ClusterToolbar);

export default VisibleClusterToolbar;

