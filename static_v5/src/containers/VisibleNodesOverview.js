import React from 'react';
import { connect } from 'react-redux';

import NodesOverview from 'components/node/NodesOverview';
import { selectNode } from 'actions/currentView';
import { NODE_ACTIONS }  from 'classes/entityActions';

const  mapStateToProps = (state) => {
  const { clusterID } = state.currentView;

  return {
    clusterID: clusterID,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    // select a node
    onSelectNode: (clusterID, nodeHost) => {
      dispatch(selectNode(clusterID, nodeHost, NODE_ACTIONS.View));
    }
  };
};

const VisibleNodesOverview = connect(
  mapStateToProps,
  mapDispatchToProps
)(NodesOverview);

export default VisibleNodesOverview;


