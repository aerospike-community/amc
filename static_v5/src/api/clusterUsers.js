import { deleteAPI, get, postJSON, putJSON } from 'api/http';
import { toURLConverter } from 'api/url';

const toURLPath = toURLConverter('connections');

// getUsers gets all the users in the cluster
export function getUsers(clusterID) {
  const url = toURLPath(clusterID + '/users');
  return get(url);
}

// getUser gets a user in the cluster
export function getUser(clusterID, name) {
  const url = toURLPath(clusterID + '/users/' + name);
  return get(url);
}

// createUser creaters a user in the cluster
export function createUser(clusterID, name, password, roles = []) {
  const data = {
    username: name,
    roles: roles,
    password: password,
  };
  
  const url = toURLPath(clusterID + '/users');
  return putJSON(url, data);
}

// updateUser updates a user in the cluster
export function updateUser(clusterID, name, password, addRoles, revokeRoles) {
  const data = {
    username: name,
    grantRoles: addRoles,
    revokeRoles: revokeRoles,
    password: password,
  };
  
  const url = toURLPath(clusterID + '/users');
  return postJSON(url, data);
}

// deleteUser deletes a user in the cluster
export function deleteUser(clusterID, name) {
  const url = toURLPath(clusterID + '/users/' + name);
  return deleteAPI(url);
}

