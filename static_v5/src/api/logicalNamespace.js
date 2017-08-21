import { toURLConverter } from 'api/url';
import { get, postJSON } from 'api/http';

const urlConverter = toURLConverter('connections');
const toURLPath = (clusterID, namespaceName, path = '', query = {}) => {
  let p = clusterID + '/logical-namespaces/' + namespaceName;
  if (path)
    p += '/' + path;
  return urlConverter(p, query);
}

// getStatistics returns the statistics for the namespace
export function getStatistics(clusterID, namespaceName) {
  const url = toURLPath(clusterID, namespaceName);
  return get(url);
}

// getLatency fetches the latency for the namespace in 
// the given time window
export function getLatency(clusterID, namespaceName, from, to) {
  let query = {}
  if (from)
    query.from = from;
  if (to)
    query.until = to; 

  const url = toURLPath(clusterID, namespaceName, 'latency', query);
  return get(url);
}

// getThroughput fetches the throughput for the namespace in 
// the given time window
export function getThroughput(clusterID, namespaceName, from, to) {
  let query = {}
  if (from)
    query.from = from;
  if (to)
    query.until = to; 

  const url = toURLPath(clusterID, namespaceName, 'throughput', query);
  return get(url);
}

