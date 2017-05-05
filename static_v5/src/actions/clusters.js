import { addConnectionAPI, authConnection as authConnectionAPI, listConnections } from '../api/clusterConnections';

// ---------------------------
// Adding a Cluster Connection

export const DISPLAY_ADD_CLUSTER_CONNECTION = 'DISPLAY_ADD_CLUSTER_CONNECTION';
export function displayAddClusterConnection(display) {
  return {
    type: DISPLAY_ADD_CLUSTER_CONNECTION,
    display: display,
  };
}

export const ADDING_CLUSTER_CONNECTION = 'ADDING_CLUSTER_CONNECTION';
function addingConnection() {
  return {
    type: ADDING_CLUSTER_CONNECTION
  };
}

export const ADD_CLUSTER_CONNECTION = 'ADD_CLUSTER_CONNECTION';
function addConnection(connection) {
  return {
    type: ADD_CLUSTER_CONNECTION,
    connection: connection
  };
}

export function addClusterConnection(connection) {
  const seeds = connection.seeds.map((seed) => {
    seed.port = parseInt(seed.port, 10);
    return seed;
  });
  connection.seeds = seeds;
  return function(dispatch) {
    dispatch(addingConnection());

    addConnectionAPI(connection)
      .then(function(response) {
        if (true || response.OK) { // FIXME
          dispatch(addConnection(connection));
        } else {
        } // TODO
      });
  }
}

// -------------------------
// Fetch Cluster Connections

export const REQUEST_CLUSTERS = 'REQUEST_CLUSTERS';
function requestClusters() {
  return {
    type: REQUEST_CLUSTERS
  };
}

export const RECEIVE_CLUSTERS = 'RECEIVE_CLUSTERS';
function receiveClusters(clusters = []) {
  return {
    type: RECEIVE_CLUSTERS,
    clusters
  };
}

export function fetchClusters() {
  return function(dispatch) {
    dispatch(requestClusters());

    listConnections()
      .then(function(response) {
        if (response.ok)
          return response.json();
        throw new Error('Error in fetching cluster connections');
      })
      .then(function(connections) {
        dispatch(receiveClusters(connections));
      })
      .catch(function() {
        dispatch(receiveClusters([]))
      });
  }
}

// ---------------------------------
// Cluster Connection Authentication

export const DISPLAY_AUTH_CLUSTER_CONNECTION = 'DISPLAY_AUTH_CLUSTER_CONNECTION';
export function displayAuthClusterConnection(display, clusterID) {
  return {
    type: DISPLAY_AUTH_CLUSTER_CONNECTION,
    display: display,
    clusterID: clusterID,
  };
}

export const AUTHENTICATING_CLUSTER_CONNECTION = 'AUTHENTICATING_CLUSTER_CONNECTION';
function authenticatingConnection() {
  return {
    type: AUTHENTICATING_CLUSTER_CONNECTION
  };
}

export const AUTHENTICATED_CLUSTER_CONNECTION = 'AUTHENTICATED_CLUSTER_CONNECTION';
function authSuccess(entities) {
  return {
    type: AUTHENTICATED_CLUSTER_CONNECTION,
    entities: entities
  };
}

export const CLUSTER_CONNECTION_AUTH_FAILED = 'CLUSTER_CONNECTION_AUTH_FAILED';
function authFailed(errorMsg) {
  return {
    type: CLUSTER_CONNECTION_AUTH_FAILED,
    errorMsg: errorMsg
  };
}

export const DISCONNECT_CLUSTER_CONNECTION = 'DISCONNECT_CLUSTER_CONNECTION';
export function disconnectCluster(clusterID) {
  return {
    type: DISCONNECT_CLUSTER_CONNECTION,
    clusterID: clusterID
  };
}

export function authenticateClusterConnection(id, name, password) {
  return function(dispatch) {
    authConnectionAPI(id, name, password)
      .then(function(response) {
        if (response.ok)
          return response.json();
        throw new Error('Error in authenticating cluster connections');
      })
      .then(function(entities) {
        dispatch(authSuccess(entities));
      })
      .catch(function() {
        const msg = response.text || 'Failed to authenticated';
        dispatch(authFailed(msg));
      })
  }
}
