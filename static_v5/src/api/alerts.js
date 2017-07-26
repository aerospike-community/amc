import { get } from 'api/http';
import { toURLConverter } from 'api/url';

const toURLPath = toURLConverter('connections');

export function getAlerts(clusterID, lastID = null) {
  let query = {};
  if (lastID)
    query.lastId = lastID;

  const url = toURLPath(clusterID + '/notifications');
  return get(url);
}

