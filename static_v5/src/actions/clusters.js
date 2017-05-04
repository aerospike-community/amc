import { addConnection, listConnections } from '../api/clusterConnections';

export const REQUEST_CLUSTERS = 'REQUEST_CLUSTERS';
function requestClusters() {
  return {
    type: REQUEST_CLUSTERS
  };
}

export const RECEIVE_CLUSTERS = 'RECEIVE_CLUSTERS';
function receiveClusters(clusters) {
  return {
    type: RECEIVE_CLUSTERS,
    clusters
  };
}

export const DISPLAY_ADD_CLUSTER_CONNECTION = 'DISPLAY_ADD_CLUSTER_CONNECTION';
export const displayAddClusterConnection = (display) => {
  return {
    type: DISPLAY_ADD_CLUSTER_CONNECTION,
    display: display,
  };
}

export const ADD_CLUSTER_CONNECTION = 'ADD_CLUSTER_CONNECTION';
export const ADDING_CLUSTER_CONNECTION = 'ADDING_CLUSTER_CONNECTION';
export function addClusterConnection(connection) {
  const seeds = connection.seeds.map((seed) => {
    seed.port = parseInt(seed.port, 10);
    return seed;
  });
  connection.seeds = seeds;
  return function(dispatch) {
    dispatch({
      type: ADDING_CLUSTER_CONNECTION
    });

    addConnection(connection)
      .then(function(response) {
        if (true || response.OK) { // FIXME
          dispatch({
            type: ADD_CLUSTER_CONNECTION,
            connection: connection,
          });
        } else {
        } // TODO
      });
  }
}

export function fetchClusters() {
  return function(dispatch) {
    dispatch(requestClusters());

    listConnections()
      .then(function(response) {
        if (response.ok)
          return response.json();
        throw new Error('TODO: abstract out to handle response errors');
      })
      .then(function(connections) {
        dispatch(receiveClusters(connections));
      });
  }
}

