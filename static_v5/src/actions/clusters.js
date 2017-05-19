import {  authConnection as authConnectionAPI, listConnections } from '../api/clusterConnections';

import { expandEntityNode } from './entityTree';
import { toClusterPath } from '../classes/entityTree';

// ---------------------------
// Adding a Cluster Connection

export const DISPLAY_ADD_CLUSTER_CONNECTION = 'DISPLAY_ADD_CLUSTER_CONNECTION';
export function displayAddClusterConnection(display) {
  return {
    type: DISPLAY_ADD_CLUSTER_CONNECTION,
    display: display,
  };
}

export const UPDATE_CLUSTER_CONNECTION = 'UPDATE_CLUSTER_CONNECTION';
export function updateConnection(clusterID, connection) {
  return {
    type: UPDATE_CLUSTER_CONNECTION,
    seeds: connection.seeds,
    name: connection.name,
    clusterID: clusterID,
  };
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

export function initClusters() {
  return (dispatch) => {
    dispatch(requestClusters());

    listConnections()
      .then((connections) => {
        dispatch(receiveClusters(connections));
        connections.forEach((conn) => {
          if (conn.connectOnLogin) // automatically connect to 'clusters without authentication'
            authenticateClusterConnection(conn.id, '', '');
        });
      })
      .catch(() => {
        dispatch(receiveClusters([]))
      });
  }
}

export function fetchClusters() {
  return (dispatch) => {
    dispatch(requestClusters());

    listConnections()
      .then((connections) => {
        dispatch(receiveClusters(connections));
      })
      .catch(() => {
        dispatch(receiveClusters([]))
      });
  }
}

// ---------------------------------------
// Add new entities to cluster connections

export const ADD_UDF = 'ADD_UDF';
export function addUDF(clusterID, udfName, udfType) {
  return {
    type: ADD_UDF,
    clusterID: clusterID,
    udfName: udfName,
    udfType: udfType
  };
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
function authSuccess(cluster) {
  return {
    type: AUTHENTICATED_CLUSTER_CONNECTION,
    cluster: cluster
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
  return (dispatch) => {
    authConnectionAPI(id, name, password)
      .then((cluster) => {
        dispatch(authSuccess(cluster));

        const path = toClusterPath(cluster.id);
        dispatch(expandEntityNode(path));
      })
      .catch((message) => {
        message = message || 'Failed to authenticate';
        dispatch(authFailed(message));
      })
  }
}
