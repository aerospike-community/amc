import React from 'react';
import { connect } from 'react-redux';
import MainDashboard from '../components/MainDashboard';
import { CLUSTER_ENTITY_TYPE } from '../classes/constants';

const mapStateToProps = (state) => {
  const {type, value, view} = state.clusterEntity;
  const node = type === CLUSTER_ENTITY_TYPE.NODE ? value : null;
  const namespace = type === CLUSTER_ENTITY_TYPE.NAMESPACE ? value : null;
  return {
    maindashboard: type,
    node: node,
    namespace: node,
    view: view,
  };
};

const VisibleMainDashboard = connect(
  mapStateToProps
)(MainDashboard);

export default VisibleMainDashboard;

