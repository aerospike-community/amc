import React from 'react';
import { connect } from 'react-redux';
import EntityTree from '../components/EntityTree';
import { clusterEntitySelected, entityViewSelected } from '../actions/clusterEntity';
import { expandEntityNode, collapseEntityNode } from '../actions/entityTree';
import { displayAuthClusterConnection, disconnectCluster } from '../actions/clusters';
import { toPhysicalEntityTree } from '../classes/entityTree';

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
    selectedEntity: state.clusterEntity.value,
    isExpanded: (treeNode) => state.entityTree.expanded.has(treeNode.id)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onEntitySelect: (entity) => {
      dispatch(clusterEntitySelected(entity))
    },
    onEntityAction: (entity, action) => {
      if (action === 'Connect') 
        dispatch(displayAuthClusterConnection(true, entity.id));
      else if (action === 'Disconnect')
        dispatch(disconnectCluster(entity.id));
      // else TODO
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
