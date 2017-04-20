import React from 'react';
import { connect } from 'react-redux';
import Clusters from '../components/Clusters';
import { clusterEntitySelected, entityViewSelected } from '../actions';

const mapStateToProps = (state) => {
  return {
    isFetching: state.clusters.isFetching,
    clusters: state.clusters.items,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onEntityClick: (entity) => {
      dispatch(clusterEntitySelected(entity))
    },
    onViewClick: (entity, view) => {
      dispatch(entityViewSelected(entity, view));
    }
  };
};

const VisibleClusters = connect(
  mapStateToProps,
  mapDispatchToProps
)(Clusters);

export default VisibleClusters;
