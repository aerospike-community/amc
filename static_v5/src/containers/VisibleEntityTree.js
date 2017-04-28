import React from 'react';
import { connect } from 'react-redux';
import EntityTree from '../components/EntityTree';
import { clusterEntitySelected, entityViewSelected } from '../actions/clusterEntity';
import { expandEntityNode, collapseEntityNode } from '../actions/entityTree';

const mapStateToProps = (state) => {
  return {
    isFetching: state.clusters.isFetching,
    clusters: state.clusters.items,
    expanded: state.entityTree.expanded,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onEntitySelect: (entity) => {
      dispatch(clusterEntitySelected(entity))
    },
    onEntityViewSelect: (entity, view) => {
      dispatch(entityViewSelected(entity, view));
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
