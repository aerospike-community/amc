import { toURLConverter } from 'api/url';
import { get, deleteAPI, postJSON } from 'api/http';

const toURLPath = toURLConverter('connections');

export function getIndexes(clusterID, includeStats = true) {
  const query = {
    includeStats: includeStats,
  };

  const url = toURLPath(clusterID + '/indexes', query);
  const p = get(url)
            .then((response) => {
              let indexes = [];
              // server returns data for each node
              // pick any
              for (let n in response.indexes) {
                indexes = response.indexes[n];
              }
              return indexes;
            });

  return p;
}

// getIndex gets the statistics for the index
export function getIndex(clusterID, indexName) {
  const url = toURLPath(clusterID + '/indexes/' + indexName);
  const p = get(url)
            .then((response) => {
              const { indexes } = response;
              const nodes = Object.keys(indexes);
              return indexes[nodes[0]][0];
            });

  return p;
}

// deleteIndex deletes an index
export function deleteIndex(clusterID, namespaceName, setName, indexName) {
  const url = toURLPath(clusterID + '/indexes/' + indexName);
  return deleteAPI(url, {
    namespace: namespaceName,
    setName: setName
  });
}

// set - optional
export function createIndex(clusterID, indexName, namespace, set, bin, isNumeric = false) {
  let data = {
    namespace: namespace,
    setName: set,
    indexName: indexName,
    binName: bin,
    type: isNumeric ? 'NUMERIC' : 'STRING',
  };

  const url = toURLPath(clusterID + '/indexes');
  return postJSON(url, data);
}

