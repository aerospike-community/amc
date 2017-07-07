import { REQUEST_CLUSTERS, RECEIVE_CLUSTERS } from 'actions/clusters';
import { DISPLAY_ADD_CLUSTER_CONNECTION } from 'actions/clusters';
import { AUTHENTICATING_CLUSTER_CONNECTION, DISPLAY_AUTH_CLUSTER_CONNECTION } from 'actions/clusters';
import { AUTHENTICATED_CLUSTER_CONNECTION, CLUSTER_CONNECTION_AUTH_FAILED, DISCONNECT_CLUSTER_CONNECTION } from 'actions/clusters';
import { UPDATE_CLUSTER_CONNECTION, CLUSTER_CONNECTION_FETCHED } from 'actions/clusters';
import { DELETE_CLUSTER_CONNECTION, DISPLAY_VIEW_CLUSTER_CONNECTION } from 'actions/clusters';
import { ENTITY_TYPE } from 'classes/constants';

// all the cluster connections of the user
export default function(state = {
    // adding a new connection
    newConnection: {
      inProgress: false, // in the process of adding a new connection
    },

    // authenticating a cluster connection
    authConnection: {
      clusterID: '',
      inProgress: false, // in the process of authenticating a connection
      isUpdating: false,
      hasFailed: false,
      failureMessage: '',
    },

    // view a connection
    viewConnection: {
      clusterID: null,
      display: false,
      isEdit: false,
    },

    // all the clusters of the user.
    // not all of them are authenticated
    isFetching: false,
    isInitialized: false,
    items: [],

  }, action) {
  let updated = clusters(state, action);
  updated = updateClusterConnection(updated, action);
  updated = newConnection(updated, action);
  updated = authConnection(updated, action);
  updated = viewConnection(updated, action);
  return updated;
}

function updateItem(state, clusterID, update, replace = false) {
  const clusters = state.items.slice(); // copy
  const i = clusters.findIndex((c) => c.id === clusterID);

  let cluster;
  if (replace) {
    let c = {};
    // preserve only these properties
    ['id', 'name', 'connectOnLogin', 'connected', 'seeds'].forEach((p) => {
      c[p] = clusters[i][p];
    });
    cluster = Object.assign({}, c, update);
  } else {
    cluster = Object.assign({}, clusters[i], update);
  }

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

    case CLUSTER_CONNECTION_FETCHED:
      id = action.cluster.id;
      update = Object.assign({}, action.cluster, {
        isAuthenticated: true
      });
      return updateItem(state, id, update, true);

    case DISCONNECT_CLUSTER_CONNECTION:
      id = action.clusterID;
      return updateItem(state, id, {
        [ENTITY_TYPE.UDF]: [],
        [ENTITY_TYPE.NODES]: [],
        isAuthenticated: false,
      });

    case DELETE_CLUSTER_CONNECTION: 
      id = action.clusterID;
      const clusters = state.items.slice(); // copy
      const i = clusters.findIndex((c) => c.id === id);
      clusters.splice(i, 1);
      return Object.assign({}, state, {
        items: clusters
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

// remove entity from array of cluster entity type
function removeClusterEntity(state, clusterID, entityType, isEqual) {
  const clusters = state.items.slice(); // copy
  const i = clusters.findIndex((c) => c.id === clusterID);
  let c = Object.assign({}, clusters[i]); // copy

  let entities = c[entityType].slice(); // copy
  const j = entities.findIndex((e) => isEqual(e));
  entities.splice(j, 1);

  c[entityType] = entities;
  clusters[i] = c;
  return Object.assign({}, state, {
    items: clusters
  });
}

// update the cluster itself
function updateClusterConnection(state, action) {
  let id;
  switch (action.type) {
    case UPDATE_CLUSTER_CONNECTION:
      id = action.clusterID;
      return updateItem(state, id, {
        seeds: action.seeds,
        name: action.name
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

function viewConnection(state, action) {
  let id;
  switch (action.type) {
    case DISPLAY_VIEW_CLUSTER_CONNECTION:
      id = action.clusterID;
      return Object.assign({}, state, {
        viewConnection: {
          display: action.display,
          clusterID: id,
          isEdit: action.isEdit,
        }
      });

    default:
      return state;
  }
}
