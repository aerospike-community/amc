import React from 'react';
import { connect } from 'react-redux';
import EntityTree from '../components/EntityTree';
import { clusterEntitySelected, entityViewSelected } from '../actions';

const mapStateToProps = (state) => {
  return {
    isFetching: state.clusters.isFetching,
    clusters: state.clusters.items,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onEntitySelect: (entity) => {
      dispatch(clusterEntitySelected(entity))
    },
    onEntityViewSelect: (entity, view) => {
      dispatch(entityViewSelected(entity, view));
    }
  };
};

const VisibleEntityTree = connect(
  mapStateToProps,
  mapDispatchToProps
)(EntityTree);

export default VisibleEntityTree;
