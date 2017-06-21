import { toURLConverter } from 'api/url';
import { get, postJSON } from 'api/http';

const toURLPath = toURLConverter('connections');

// getThroughput fetches the throughput for the node in 
// the given time window
export function getThroughput(clusterID, nodeHost, from, to) {
  let query = {}
  if (from)
    query.from = from;
  if (to)
    query.until = to; 

  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/throughput', query);
  return get(url);
}

// getLatency fetches the latency for the node in 
// the given time window
export function getLatency(clusterID, nodeHost, from, to) {
  let query = {}
  if (from)
    query.from = from;
  if (to)
    query.until = to; 

  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/latency', query);
  return get(url);
}

// getNodesSummary fetches the summary for the member nodes
// identified by nodeHosts
//
// nodeHosts - example ['192.168.121.14:3000', ...]
export function getNodesSummary(clusterID, nodeHosts) {
  const nodes = nodeHosts.join(',');
  const url = toURLPath(clusterID + '/nodes/' + nodes);
  return get(url);
}

// getConfig fetches the config of the node
export function getConfig(clusterID, nodeHost) {
  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/config');
  return get(url);
}

// setConfig sets the configs
export function setConfig(clusterID, nodeHost, config) {
  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/config');
  return postJSON(url, {
    newConfig: config
  });
}

