import { combineReducers } from 'redux';
import { REQUEST_CLUSTERS, RECEIVE_CLUSTERS } from '../actions';
import { SELECT_NODE, SELECT_NAMESPACE, SELECT_CLUSTER, SELECT_ENTITY_VIEW } from '../actions';
import { ENTITY_NODE_EXPANDED, ENTITY_NODE_COLLAPSED } from '../actions';
import { DISPLAY_ADD_CLUSTER_CONNECTION } from '../actions';
import { CLUSTER_ENTITY_TYPE } from '../classes/constants';

function clusters(state = {
    displayAddConnection: false,
    isFetching: false,
    items: [],
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
    case DISPLAY_ADD_CLUSTER_CONNECTION:
      return Object.assign({}, state, {
        displayAddConnection: action.display,
      });
    default:
      return state;
  }
}

function entityTree(state = {
    expanded: new Set()
  }, action) {
  const expanded = new Set(state.expanded);
  switch (action.type) {
    case ENTITY_NODE_EXPANDED:
      expanded.add(action.node);
      return Object.assign({}, state, {
        expanded: expanded,
      });
    case ENTITY_NODE_COLLAPSED:
      expanded.delete(action.node);
      return Object.assign({}, state, {
        expanded: expanded
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
        type: CLUSTER_ENTITY_TYPE.NODE, // FIXME assign based on entity type
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
  entityTree, // state of the entity tree
});

export default app;
