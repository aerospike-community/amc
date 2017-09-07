import React from 'react';
import { connect } from 'react-redux';

import EntityTree from 'components/cluster/EntityTree';
import { selectEntity } from 'actions/currentView';
import { expandEntityNode, collapseEntityNode } from 'actions/entityTree';
import { displayAuthClusterConnection, displayViewClusterConnection, disconnectCluster } from 'actions/clusters';
import { toPhysicalEntityTree, toLogicalEntityTree } from 'classes/entityTree';
import { VIEW_TYPE } from 'classes/constants';
import { CLUSTER_ACTIONS } from 'classes/entityActions';
import { selectStartView } from 'actions/currentView';
import { isEntitiesEqual, isLogicalView } from 'classes/util';
import { isPermissibleAction, isPermissibleSetAction, isPermissibleNamespaceAction } from 'classes/entityActions';

// the latest current view
let CurrentView;

const mapStateToProps = (state) => {
  CurrentView = state.currentView;

  let clusters = state.clusters.items;
  let items = [];
  // trasform each cluster to entity tree representation
  clusters.forEach((c) => {
    let item;
    if (isLogicalView(CurrentView.viewType))
      item = toLogicalEntityTree(c, c.isAuthenticated)
    else
      item = toPhysicalEntityTree(c, c.isAuthenticated);

    items.push(item);
  });

  return {
    isFetching: state.clusters.isFetching,
    clusters: items,
    isExpanded: (treeNode) => state.entityTree.expanded.has(treeNode),
    alerts: state.alerts,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onEntitySelect: (entity, defView = '') => {
      if (CurrentView.viewType !== entity.viewType) {
        dispatch(selectEntity(entity, defView));
        return;
      }

      const vt = entity.viewType;
      const v = CurrentView.view;
      const { clusterID, namespaceName, setName } = entity;
      let canAccess = false;
      
      if (vt === VIEW_TYPE.NAMESPACE) 
        canAccess = isPermissibleNamespaceAction(v, clusterID, namespaceName);
      else if (vt == VIEW_TYPE.SET) 
        canAccess = isPermissibleSetAction(v, clusterID, namespaceName, setName);
      else 
        canAccess = isPermissibleAction(v, clusterID, vt);

      if (canAccess)
        dispatch(selectEntity(entity, CurrentView.view));
      else
        dispatch(selectEntity(entity, defView));
    },

    onEntityAction: (entity, action) => {
      const { clusterID, viewType } = entity;

      if (viewType === VIEW_TYPE.CLUSTER || viewType === VIEW_TYPE.LOGICAL_CLUSTER) {
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
