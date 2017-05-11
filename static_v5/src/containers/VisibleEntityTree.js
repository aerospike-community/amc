import React from 'react';
import { connect } from 'react-redux';
import EntityTree from '../components/EntityTree';
import { selectPath } from '../actions/currentView';
import { expandEntityNode, collapseEntityNode } from '../actions/entityTree';
import { displayAuthClusterConnection, disconnectCluster } from '../actions/clusters';
import { toPhysicalEntityTree } from '../classes/entityTree';
import { VIEW_TYPE } from '../classes/constants';

const mapStateToProps = (state) => {
  let clusters = state.clusters.items;
  let items = [];
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
    onEntitySelect: (entity) => {
      dispatch(selectPath(entity.path));
    },

    onEntityAction: (entity, action) => {
      if (action === 'Connect') 
        dispatch(displayAuthClusterConnection(true, entity.path));
      else if (action === 'Disconnect')
        dispatch(disconnectCluster(entity.path));
      // else TODO
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
