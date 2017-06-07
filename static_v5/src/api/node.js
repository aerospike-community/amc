import { toURLConverter } from 'api/url';
import { get } from 'api/http';

const toURLPath = toURLConverter('connections');

export function getThroughput(clusterID, nodeHost, from, to) {
  let query = {}
  if (from)
    query.from = from;
  if (false && to) // FIXME breaks API
    query.until = to; 

  const url = toURLPath(clusterID + '/nodes/' + nodeHost + '/throughput', query);
  return get(url);
}

