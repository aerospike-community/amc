import { REQUEST_CLUSTERS, RECEIVE_CLUSTERS } from '../actions/clusters';
import { ADDING_CLUSTER_CONNECTION, ADD_CLUSTER_CONNECTION, DISPLAY_ADD_CLUSTER_CONNECTION } from '../actions/clusters';
import { AUTHENTICATING_CLUSTER_CONNECTION, DISPLAY_AUTH_CLUSTER_CONNECTION } from '../actions/clusters';
import { AUTHENTICATED_CLUSTER_CONNECTION, CLUSTER_CONNECTION_AUTH_FAILED, DISCONNECT_CLUSTER_CONNECTION } from '../actions/clusters';

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
    items: [],

  }, action) {
  let updated = clusters(state, action);
  updated = newConnection(updated, action);
  updated = authCluster(updated, action);
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
  let id;
  switch (action.type) {
    case REQUEST_CLUSTERS:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case RECEIVE_CLUSTERS:
      return Object.assign({}, state, {
        isFetching: false,
        items: action.clusters || [],
      });
    case AUTHENTICATED_CLUSTER_CONNECTION:
      id = state.authConnection.clusterID;
      return updateItem(state, id, {
        entities: action.entities.nodes, // TODO all the entities
        isAuthenticated: true,
      });
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

function authCluster(state, action) {
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
