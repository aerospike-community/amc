import { toURLConverter } from 'api/url';
import { get } from 'api/http';

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



