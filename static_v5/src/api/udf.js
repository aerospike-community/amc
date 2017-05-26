import { toURLConverter } from 'api/url';
import { get, postJSON, deleteAPI } from 'api/http';

const converter = toURLConverter('connections');
function toURLPath(clusterID, name) {
  if (name && name.length > 0)
    return converter(`${clusterID}/modules/${name}`);
  return converter(`${clusterID}/modules`);
}

export function getUDF(clusterID, name) {
  const url = toURLPath(clusterID, name);
  return get(url);
}

export function saveUDF(clusterID, udfName, sourceCode) {
  const url = toURLPath(clusterID);
  return postJSON(url, {
    name: udfName,
    source: sourceCode,
    type: 'lua',
  });
}

export function deleteUDF(clusterID, name) {
  const url = toURLPath(clusterID, name);
  return deleteAPI(url);
}

