import { toURLConverter } from 'api/url';
import { get, postJSON } from 'api/http';

const toURLPath = toURLConverter('deployments');

// getThroughput fetches the throughput for the node in 
// the given time window
export function getHostname(nodeHost) {
  let query = {}
  const url = toURLPath(nodeHost, query);
  return get(url);
}
