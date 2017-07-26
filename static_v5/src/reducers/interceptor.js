import { AUTHENTICATED_CLUSTER_CONNECTION, DISCONNECT_CLUSTER_CONNECTION } from 'actions/clusters';
import { CLUSTER_CONNECTION_FETCHED, DELETE_CLUSTER_CONNECTION } from 'actions/clusters';
import { LOGOUT_USER } from 'actions/authenticate';

import { getConnectionDetails } from 'api/clusterConnections';

// All _META_ functionality which is dependent on the actions
export default function(state = {}, action) {
  handleClusterPollers(action);
  return state;
}

// ClusterPoller keeps polling the cluster at the server
// to keep the cluster alive at the server.
class ClusterPoller {
  constructor() {
    // set of clusters to poll
    this.clusters = new Set();

    this.interval = 10*1000; // 10 seconds
  }

  add(clusterID) {
    if (this.clusters.has(clusterID))
      return;

    this.clusters.add(clusterID);
    // don't use setInterval. 
    // see http://reallifejs.com/brainchunks/repeated-events-timeout-or-interval
    const poll = () => {
      // stop if not in set
      if (!this.clusters.has(clusterID))
        return;

      getConnectionDetails(clusterID)
        .then(() =>  window.setTimeout(poll, this.interval))
        .catch(() => window.setTimeout(poll, this.interval));
    };
    window.setTimeout(poll, this.interval);
  }

  remove(clusterID) {
    this.clusters.delete(clusterID);
  }

  removeAll() {
    this.clusters.forEach((id) => {
      this.remove(id);
    });
  }
}
const CPoller = new ClusterPoller();

// handle cluster polling
function handleClusterPollers(action) {
  let id;
  switch (action.type) {
    case AUTHENTICATED_CLUSTER_CONNECTION:
    case CLUSTER_CONNECTION_FETCHED:
      id = action.cluster.id;
      CPoller.add(id);
      break;
      
    case DISCONNECT_CLUSTER_CONNECTION:
    case DELETE_CLUSTER_CONNECTION:
      id = action.clusterID;
      CPoller.remove(id);
      break;

    case LOGOUT_USER:
      CPoller.removeAll();
      break;

  }
}

