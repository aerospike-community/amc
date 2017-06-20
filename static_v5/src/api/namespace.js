import { toURLConverter } from 'api/url';
import { get } from 'api/http';

const toURLPath = toURLConverter('connections');

// getThroughput fetches the throughput for the namespace in 
// the given time window
export function getThroughput(clusterID, nodeHost, namespaceName, from, to) {
  let query = {}
  if (from)
    query.from = from;
  if (to)
    query.until = to; 

  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/namespaces/' + namespaceName + '/throughput', query);
  return get(url);
}

// getLatency fetches the latency for the namespace in 
// the given time window
export function getLatency(clusterID, nodeHost, namespaceName, from, to) {
  let query = {}
  if (from)
    query.from = from;
  if (to)
    query.until = to; 

  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/namespaces/' + namespaceName + '/latency', query);
  return get(url);
}

