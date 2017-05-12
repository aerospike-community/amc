import { toURLConverter } from './url';
import { get, postJSON, deleteAPI } from './http';

const converter = toURLConverter('connections');
function toURLPath(clusterID, name) {
  return converter(`${clusterID}/modules/${name}`);
}

export function getUDF(clusterID, name) {
  const url = toURLPath(clusterID, name);
  return get(url);
}

export function saveUDF(clusterID, name, sourceCode) {
  const url = toURLPath(clusterID, name);
  return postJSON(url, {
    name: name,
    source: sourceCode,
    type: 'lua',
  });
}

export function deleteUDF(clusterID, name) {
  const url = toURLPath(clusterID, name);
  return deleteAPI(url);
}

