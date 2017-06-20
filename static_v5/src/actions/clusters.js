import {  authConnection as authConnectionAPI, listConnections, getClusterEntityTree as getClusterEntityTreeAPI } from 'api/clusterConnections';

import { expandEntityNode } from 'actions/entityTree';
import { toClusterPath } from 'classes/entityTree';
import { selectClusterOnStartup } from 'actions/currentView';

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

// -----------------------------
// Deleting a cluster connection
export const DISPLAY_DELETE_CLUSTER_CONNECTION = 'DISPLAY_DELETE_CLUSTER_CONNECTION';
export function displayDeleteClusterConnection(display) {
  return {
    type: DISPLAY_DELETE_CLUSTER_CONNECTION,
    display: display,
  };
}

export const DELETE_CLUSTER_CONNECTION = 'DELETE_CLUSTER_CONNECTION';
export function deleteClusterConnection(clusterID) {
  return {
    type: DELETE_CLUSTER_CONNECTION,
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

        // connect to clusters
        connections.forEach((conn) => {
          if (conn.connected) 
            dispatch(getClusterEntityTree(conn.id));
          else if (conn.connectOnLogin)  // automatically connect to 'clusters without authentication'
            authenticateClusterConnection(conn.id, '', '');
        });

        // select a cluster for overview
        for (let i = 0; i < connections.length; i++) {
          const c = connections[i];
          if (c.connected || c.connectOnLogin) {
            const clusterID = c.id;
            dispatch(selectClusterOnStartup(clusterID));
            break;
          }
        }
      })
      .catch((message) => {
        // TODO 
        console.error('Fetching cluster failed: ' + message);
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

export const CLUSTER_CONNECTION_FETCHED = 'CLUSTER_CONNECTION_FETCHED';
function clusterDetails(cluster) {
  return {
    type: CLUSTER_CONNECTION_FETCHED,
    cluster: cluster
  };
}

// expand the cluster tree identified by the cluster id
function expandClusterTree(clusterID) {
  const path = toClusterPath(clusterID);
  return expandEntityNode(path);
}

// get the cluster entity tree
// WARNING: the cluster needs to be connected
export function getClusterEntityTree(clusterID) {
  return (dispatch) => {
    getClusterEntityTreeAPI(clusterID)
      .then((cluster) => {
        dispatch(clusterDetails(cluster));
        
        // expand the cluster tree
        dispatch(expandClusterTree(clusterID));
      })
      .catch((error) => {
        // TODO
        console.error('Failed to fetch cluster details for ' + clusterID);
      });
  }
}

export function authenticateClusterConnection(id, name, password) {
  return (dispatch) => {
    authConnectionAPI(id, name, password)
      .then((cluster) => {
        dispatch(authSuccess(cluster));

        // expand the cluster on authentication
        dispatch(expandClusterTree(cluster.id));
      })
      .catch((message) => {
        message = message || 'Failed to authenticate';
        dispatch(authFailed(message));
      })
  }
}
