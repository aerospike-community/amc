import { toURLConverter } from 'api/url';
import { get, deleteAPI } from 'api/http';

const toURL = toURLConverter('connections');

function toURLPath(clusterID, nodeHost, namespaceName, set = '', path = '', query = {}) {
  let p = clusterID + '/nodes/' + nodeHost + '/namespaces/' + namespaceName + '/sets';
  if (set.length > 0)
    p += '/' + set;
  if (path.length > 0)
    p += '/' + path;

  return toURL(p, query);
}

// getSets gets information about all the sets in a namespace of a node
export function getSets(clusterID, nodeHost, namespaceName) {
  const url = toURLPath(clusterID, nodeHost, namespaceName);
  return get(url);
}

// getSet gets information about a set in a namespace of a node
export function getSet(clusterID, nodeHost, namespaceName, setName) {
  const url = toURLPath(clusterID, nodeHost, namespaceName, setName);
  return get(url);
}

// deleteSet deletes a set from a cluster
export function deleteSet(clusterID, nodeHost, namespaceName, setName) {
  const url = toURLPath(clusterID, nodeHost, namespaceName, setName);
  return deleteAPI(url);
}


