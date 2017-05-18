import { REQUEST_CLUSTERS, RECEIVE_CLUSTERS } from '../actions/clusters';
import { ADDING_CLUSTER_CONNECTION, ADD_CLUSTER_CONNECTION, DISPLAY_ADD_CLUSTER_CONNECTION } from '../actions/clusters';
import { AUTHENTICATING_CLUSTER_CONNECTION, DISPLAY_AUTH_CLUSTER_CONNECTION } from '../actions/clusters';
import { AUTHENTICATED_CLUSTER_CONNECTION, CLUSTER_CONNECTION_AUTH_FAILED, DISCONNECT_CLUSTER_CONNECTION } from '../actions/clusters';
import { ADD_UDF } from '../actions/clusters';
import { ENTITY_TYPE } from '../classes/constants';

// all the cluster connections of the user
export default function(state = {
    // adding a new connection
    newConnection: {
      inProgress: false, // in the process of adding a new connection
      isUpdating: false,
    },

    // authenticating a cluster connection
    authConnection: {
      clusterID: '',
      inProgress: false, // in the process of authenticating a connection
      isUpdating: false,
      hasFailed: false,
      failureMessage: '',
    },

    // all the clusters of the user.
    // not all of them are authenticated
    isFetching: false,
    isInitialized: false,
    items: [],

  }, action) {
  let updated = clusters(state, action);
  updated = updateClusterEntities(updated, action);
  updated = newConnection(updated, action);
  updated = authConnection(updated, action);
  return updated;
}

function updateItem(state, clusterID, update) {
  const clusters = state.items.slice(); // copy
  const i = clusters.findIndex((c) => c.id === clusterID);
  const cluster = Object.assign({}, clusters[i], update);
  clusters[i] = cluster;
  return Object.assign({}, state, {
    items: clusters
  });
}

function clusters(state, action) {
  let id, update;
  switch (action.type) {
    case REQUEST_CLUSTERS:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case RECEIVE_CLUSTERS:
      return Object.assign({}, state, {
        isFetching: false,
        isInitialized: true,
        items: action.clusters || [],
      });
    case AUTHENTICATED_CLUSTER_CONNECTION:
      id = state.authConnection.clusterID;
      update = Object.assign({}, action.cluster, {
        isAuthenticated: true
      });
      return updateItem(state, id, update);
    case DISCONNECT_CLUSTER_CONNECTION:
      id = state.authConnection.clusterID;
      return updateItem(state, id, {
        entities: [],
        isAuthenticated: false,
      });
    default:
      return state;
  }
}

// add entity to array of given entity type
function addToClusterEntity(state, clusterID, entityType, entity) {
  const clusters = state.items.slice(); // copy
  const i = clusters.findIndex((c) => c.id === clusterID);
  let c = Object.assign({}, clusters[i]); // copy

  let e = [];
  if (Array.isArray(c[entityType]))
    e = c[entityType].slice(); // copy
  e.push(entity);

  c[entityType] = e;
  clusters[i] = c;
  return Object.assign({}, state, {
    items: clusters
  });
}

// add and remove entities from the cluster connections
function updateClusterEntities(state, action) {
  let entity, id;
  switch (action.type) {
    case ADD_UDF:
      id = action.clusterID;
      entity = Object.assign({}, {
        type: action.type,
        name: action.udfName, 
        entityType: ENTITY_TYPE.UDF,
      });
      return addToClusterEntity(state, id, ENTITY_TYPE.UDF, entity);
    default:
      return state;
  }
}

function newConnection(state, action) {
  let newConnection;
  switch (action.type) {
    case DISPLAY_ADD_CLUSTER_CONNECTION:
      newConnection = Object.assign({}, state.newConnection, {
        inProgress: action.display
      });
      break;
    case ADD_CLUSTER_CONNECTION:
      newConnection = Object.assign({}, state.newConnection, {
        inProgress: false,
        isUpdating: false,
      });
      break;
    case ADDING_CLUSTER_CONNECTION:
      newConnection = Object.assign({}, state.newConnection, {
        isUpdating: true,
      });
      break;
    default:
      return state;
  }
  return Object.assign({}, state, {
    newConnection: newConnection
  });
}

function authConnection(state, action) {
  let auth;
  switch (action.type) {
    case DISPLAY_AUTH_CLUSTER_CONNECTION:
      auth = Object.assign({}, state.authConnection, {
        inProgress: action.display,
        clusterID: action.clusterID
      });
      if (!action.display)
        auth.hasFailed = false;
      break;
    case AUTHENTICATED_CLUSTER_CONNECTION:
      auth = Object.assign({}, state.authConnection, {
        inProgress: false,
      });
      break;
    case AUTHENTICATING_CLUSTER_CONNECTION:
      auth = Object.assign({}, state.authConnection, {
        isUpdating: true
      });
      break;
    case CLUSTER_CONNECTION_AUTH_FAILED:
      auth = Object.assign({}, state.authConnection, {
        hasFailed: true,
        failureMessage: action.errorMsg
      });
      break;
    default:
      return state;
  }
  return Object.assign({}, state, {
    authConnection: auth
  });
}
