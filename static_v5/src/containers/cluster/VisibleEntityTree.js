import React from 'react';
import { connect } from 'react-redux';

import EntityTree from 'components/cluster/EntityTree';
import { selectPath } from 'actions/currentView';
import { expandEntityNode, collapseEntityNode } from 'actions/entityTree';
import { displayAuthClusterConnection, displayViewClusterConnection, disconnectCluster } from 'actions/clusters';
import { toPhysicalEntityTree } from 'classes/entityTree';
import { VIEW_TYPE } from 'classes/constants';
import { CLUSTER_ACTIONS } from 'classes/entityActions';
import { matchAndExtractEntityPathVariabes } from 'classes/urlAndViewSynchronizer';
import { selectStartView } from 'actions/currentView';

const mapStateToProps = (state) => {
  let clusters = state.clusters.items;
  let items = [];
  // trasform each cluster to entity tree representation
  clusters.forEach((c) => {
    const item = toPhysicalEntityTree(c);
    items.push(item);
  });

  return {
    isFetching: state.clusters.isFetching,
    clusters: items,
    selectedEntityPath: state.currentView.selectedEntityPath,
    isExpanded: (treeNode) => state.entityTree.expanded.has(treeNode.path)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onEntitySelect: (entity, view = '') => {
      dispatch(selectPath(entity.path, view));
    },

    onEntityAction: (entity, action) => {
      const {clusterID} = matchAndExtractEntityPathVariabes(entity.path);

      if (entity.viewType === VIEW_TYPE.CLUSTER) {
        if (action === CLUSTER_ACTIONS.Connect) {
          dispatch(displayAuthClusterConnection(true, clusterID));
          return;
        } 
        if (action === CLUSTER_ACTIONS.Disconnect) {
          dispatch(selectStartView());
          dispatch(disconnectCluster(clusterID));
          return;
        }
        if (action === CLUSTER_ACTIONS.View || action === CLUSTER_ACTIONS.Edit
            || action === CLUSTER_ACTIONS.Delete) {
          const isEdit = action === CLUSTER_ACTIONS.Edit;
          dispatch(displayViewClusterConnection(true, clusterID, isEdit));
          return;
        }
      } 

      dispatch(selectPath(entity.path, action));

    },

    onNodeExpand: (node) => {
      dispatch(expandEntityNode(node.path));
    },

    onNodeCollapse: (node) => {
      dispatch(collapseEntityNode(node.path));
    }
  };
};

const VisibleEntityTree = connect(
  mapStateToProps,
  mapDispatchToProps
)(EntityTree);

export default VisibleEntityTree;
