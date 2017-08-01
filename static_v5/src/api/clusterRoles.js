import { deleteAPI, get, postJSON, putJSON } from 'api/http';
import { toURLConverter } from 'api/url';

const toURLPath = toURLConverter('connections');

// getRoles gets all the roles in the cluster
export function getRoles(clusterID) {
  const url = toURLPath(clusterID + '/roles');
  return get(url);
}

function concatRoles(globalRoles, namespaceRoles) {
  const roles = [];
  globalRoles.forEach((role) => {
    roles.push({ privilege: role });
  });
  return roles.concat(namespaceRoles);
}

// createRole creates a role in the cluster
export function createRole(clusterID, name, globalRoles = [], namespaceRoles = []) {
  const roles = concatRoles(globalRoles, namespaceRoles);
  const data = {
    name: name,
    privileges: roles,
  };
  
  const url = toURLPath(clusterID + '/roles');
  return putJSON(url, data);
}

// updateRole updates a role in the cluster
export function updateRole(clusterID, name, globalRevokedRoles = [], globalAddedRoles = [], 
                        namespaceRevokedRoles = [], namespaceAddedRoles = []) 
{
  const revoked = concatRoles(globalRevokedRoles, namespaceRevokedRoles);
  const added = concatRoles(globalAddedRoles, namespaceAddedRoles);
  const data = {
    name: name,
    grantPrivileges: added,
    revokePrivileges: revoked,
  };
  
  const url = toURLPath(clusterID + '/roles');
  return postJSON(url, data);
}

// deleteRole deletes a role in the cluster
export function deleteRole(clusterID, name) {
  const url = toURLPath(clusterID + '/roles/' + name);
  return deleteAPI(url);
}
