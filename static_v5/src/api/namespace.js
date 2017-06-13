import { toURLConverter } from 'api/url';
import { get } from 'api/http';

const toURLPath = toURLConverter('connections');

export function getThroughput(clusterID, nodeHost, namespaceName, from, to) {
  let query = {}
  if (from)
    query.from = from;
  if (to)
    query.until = to; 

  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/namespaces/' + namespaceName + '/throughput', query);
  return get(url);
}


