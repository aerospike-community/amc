import { deleteAPI, get, postJSON } from 'api/http';
import { toURLConverter } from 'api/url';

const toURLPath = toURLConverter('connections');

// list all the connections registered by the user
export function listConnections() {
  const url = toURLPath('');
  return get(url).
    then((connections) => {
      connections = connections || [];
      return connections;
    });
}

// add a connection for the user
export function addConnection(connection) {
  const url = toURLPath('');
  return postJSON(url, connection);
}

// update a registered connection
export function updateConnection(clusterID, connection) {
  const url = toURLPath('');
  const payload = Object.assign({}, connection, {
    connId: clusterID
  });
  return postJSON(url, payload);
}

// delete a registered connection
export function deleteConnection(clusterID) {
  const url = toURLPath(clusterID);
  return deleteAPI(url);
}

// login to a connection
export function authConnection(clusterID, name, password) {
  const url = toURLPath(clusterID);
  const credentials = {
    username: name,
    password: password
  };
  return postJSON(url, credentials);
}

// get the details of the registered connection
export function getConnectionDetails(clusterID) {
  const url = toURLPath(clusterID);
  return get(url);
}

// get the entity tree of the cluster
export function getClusterEntityTree(clusterID) {
  const url = toURLPath(clusterID + '/entity-tree');
  return get(url);
}

// get the overview of all the clusters
export function getOverview() {
  const url = toURLPath('/overview');
  return get(url);
}

// get the currently logged in user
export function getLoggedInUser(clusterID) {
  const url = toURLPath(clusterID + '/user');
  return get(url);
}

// get all throughput stats for all the nodes of the connection
// from, to are in unix seconds
export function getThroughput(clusterID, from, to) {
  let query = {}
  if (from)
    query.from = from;
  if (to)
    query.until = to;

  const url = toURLPath(clusterID + '/throughput', query);
  return get(url);
}

// getLatency returns the latency for the whole cluster
export function getLatency(clusterID, from, to) {
  let query = {}
  if (from)
    query.from = from;
  if (to)
    query.until = to;

  const url = toURLPath(clusterID + '/latency', query);
  return get(url);
}

// getNamespaces returns the namespace statistics of the cluster
export function getNamespaces(clusterID)  {
  const url = toURLPath(clusterID + '/namespaces');
  return get(url);
}

// getConfig returns the configuration of the nodes
export function getNodesConfig(clusterID) {
  const url = toURLPath(clusterID + '/config');
  return get(url);
}
