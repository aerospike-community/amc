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

export function deleteConnection(id) {
  const url = toURLPath(id);
  return deleteAPI(url);
}

export function authConnection(id, name, password) {
  const url = toURLPath(id);
  const credentials = {
    username: name,
    password: password
  };
  return postJSON(url, credentials);
}

