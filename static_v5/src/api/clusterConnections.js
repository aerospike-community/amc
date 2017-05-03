import { toURLConverter } from './url';

const toURLPath = toURLConverter('connections');

export function listConnections() {
  const url = toURLPath('');
  return fetch(url, {
    method: 'GET',
  });
}

export function addConnection(connection) {
  const url = toURLPath('');
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(connection)
  });
}

export function deleteConnection(id) {
  const url = toURLPath(id);
  return fetch(url, {
    method: 'DELETE'
  });
}

