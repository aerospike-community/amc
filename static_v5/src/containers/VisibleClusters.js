import React from 'react';
import { connect } from 'react-redux';
import Clusters from '../components/Clusters';
import { clusterEntitySelected } from '../actions';

const mapStateToProps = (state) => {
  return {
    isFetching: state.clusters.isFetching,
    clusters: state.clusters.items,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onNodeClick: (id) => {
      dispatch(clusterEntitySelected(id))
    }
  };
};

const VisibleClusters = connect(
  mapStateToProps,
  mapDispatchToProps
)(Clusters);

export default VisibleClusters;
