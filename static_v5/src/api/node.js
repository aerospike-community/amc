import { toURLConverter } from 'api/url';
import { get, postJSON, deleteAPI } from 'api/http';
import { processQueryResponse } from 'api/clusterConnections';

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

// status of jobs
export const InProgress = 'in-progress';
export const Complete = 'completed';

// getJobs fetches the jobs on a node
export function getJobs(clusterID, nodeHost, status, offset = 0, limit = 100, sortBy, sortOrder) {
  let query = {
    offset: offset,
    limit: limit
  };

  if (sortBy)
    query.sortBy = sortBy;
  if (sortOrder)
    query.sortOrder = sortOrder;
  if (status)
    query.status = status;

  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/jobs', query);
  return get(url);
}

// set priority of a job
// priority - one of 'low', 'medium', 'high'
export function setJobPriority(clusterID, nodeHost, module, trid, priority) {
  const query = {
    module: module,
    priority: priority,
  };

  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/jobs/' + trid, query);
  return postJSON(url, {});
}

// kill a job
export function killJob(clusterID, nodeHost, module, trid) {
  const query = {
    module: module,
  };

  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/jobs/' + trid, query);
  return deleteAPI(url);
}

// execute the query only on the node
export function executeNodeQuery(clusterID, nodeHost, query) {
  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/aql');

  const data = {
    aql: query
  };

  return new Promise((resolve, reject) => {
    postJSON(url, data, false)
      .then((response) => processQueryResponse(response, resolve))
      .catch((msg) => reject(msg));
  });
}

// return a websocket for the logs
export function streamLogs(clusterID, nodeHost) {
  const host = document.location.host;
  const url = `ws://${host}/api/v1/connections/${clusterID}/nodes/${nodeHost}/logs`;
  return new WebSocket(url);
}
