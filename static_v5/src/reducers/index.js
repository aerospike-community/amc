import { combineReducers } from 'redux';
import { REQUEST_CLUSTERS, RECEIVE_CLUSTERS } from '../actions';
import { SELECT_NODE, SELECT_NAMESPACE, SELECT_CLUSTER, SELECT_ENTITY_VIEW } from '../actions';
import { CLUSTER_ENTITY_TYPE } from '../classes/constants';

function clusters(state = {
    isFetching: false,
    items: []
  }, action) {
  switch (action.type) {
    case REQUEST_CLUSTERS:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case RECEIVE_CLUSTERS:
      return Object.assign({}, state, {
        isFetching: false,
        items: action.clusters
      });
    default:
      return state;
  }
}

function clusterEntity(state = {
    type: CLUSTER_ENTITY_TYPE.UNDEFINED,
    view: null, // the view of interest of the entity
    value: null // the entity
  }, action) {
  switch (action.type) {
    case SELECT_CLUSTER:
      return Object.assign({}, state, {
        type: CLUSTER_ENTITY_TYPE.CLUSTER,
        value: action.cluster
      });
    case SELECT_NODE:
      return Object.assign({}, state, {
        type: CLUSTER_ENTITY_TYPE.NODE,
        value: action.node
      });
    case SELECT_NAMESPACE:
      return Object.assign({}, state, {
        type: CLUSTER_ENTITY_TYPE.NAMESPACE,
        value: action.namespace
      });
    case SELECT_ENTITY_VIEW:
      return Object.assign({}, state, {
        view: action.view,
        value: action.entity,
      });
    default:
      return state;
  }
}


const app = combineReducers({
  clusters, // the aerospike clusters
  clusterEntity, // the selected cluster entity
});

export default app;
