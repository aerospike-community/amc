import { deleteAPI, get, postJSON } from './http';
import { toURLConverter } from './url';

const toURLPath = toURLConverter('connections');

export function listConnections() {
  const url = toURLPath('');
  return get(url).
    then((connections) => {
      connections = connections || [];
      return connections;
    });
}

export function addConnection(connection) {
  const url = toURLPath('');
  return postJSON(url, connection);
}

export function updateConnection(clusterID, connection) {
  const url = toURLPath('');
  const payload = Object.assign({}, connection, {
    connId: clusterID
  });
  return postJSON(url, payload);
}

export function deleteConnection(clusterID) {
  const url = toURLPath(clusterID);
  return deleteAPI(url);
}

export function authConnection(clusterID, name, password) {
  const url = toURLPath(clusterID);
  const credentials = {
    username: name,
    password: password
  };
  return postJSON(url, credentials);
}

export function getConnectionDetails(clusterID) {
  const url = toURLPath(clusterID);
  return get(url);
}

