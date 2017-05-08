import React from 'react';
import { connect } from 'react-redux';
import EntityTree from '../components/EntityTree';
import { clusterEntitySelected, entityViewSelected } from '../actions/clusterEntity';
import { expandEntityNode, collapseEntityNode } from '../actions/entityTree';
import { displayAuthClusterConnection, disconnectCluster } from '../actions/clusters';

const mapStateToProps = (state) => {
  // FIXME is there a better way to do this
  let clusters = state.clusters.items;
  clusters.map((c) => {
    let children = [];
    if (c.isAuthenticated) {
      // FIXME entities types will change
      c.entities.map((n) => {
        n.name = n.host;
        children.push(n);
      });
    }
    c.children = children;
  });
  return {
    isFetching: state.clusters.isFetching,
    clusters: clusters,
    selectedEntity: state.clusterEntity.value,
    expanded: state.entityTree.expanded,
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
