import React from 'react';
import { connect } from 'react-redux';

import EntityTree from 'components/cluster/EntityTree';
import { selectEntity } from 'actions/currentView';
import { expandEntityNode, collapseEntityNode } from 'actions/entityTree';
import { displayAuthClusterConnection, displayViewClusterConnection, disconnectCluster } from 'actions/clusters';
import { toPhysicalEntityTree } from 'classes/entityTree';
import { VIEW_TYPE } from 'classes/constants';
import { CLUSTER_ACTIONS } from 'classes/entityActions';
import { selectStartView } from 'actions/currentView';
import { isEntitiesEqual } from 'classes/util';

// the latest current view
let CurrentView;

const mapStateToProps = (state) => {
  CurrentView = state.currentView;

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
    isExpanded: (treeNode) => state.entityTree.expanded.has(treeNode)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onEntitySelect: (entity, view = '') => {
      dispatch(selectEntity(entity, view));
    },

    onEntityAction: (entity, action) => {
      const {clusterID} = entity;

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

      dispatch(selectEntity(entity, action));

    },

    isNodeSelected: (entity) => {
      return isEntitiesEqual(entity, CurrentView);
    },

    onNodeExpand: (node) => {
      dispatch(expandEntityNode(node));
    },

    onNodeCollapse: (node) => {
      dispatch(collapseEntityNode(node));
    }
  };
};

const VisibleEntityTree = connect(
  mapStateToProps,
  mapDispatchToProps
)(EntityTree);

export default VisibleEntityTree;
