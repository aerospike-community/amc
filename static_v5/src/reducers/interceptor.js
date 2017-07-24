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
    // map of cluster id to 'interval id'
    this.pollers = {};

    this.interval = 10*1000; // 10 seconds
  }

  add(clusterID) {
    if (clusterID in this.pollers)
      return;

    const intervalID = window.setInterval(() => {
      getConnectionDetails(clusterID);
    }, this.interval);

    this.pollers[clusterID] = intervalID;
  }

  remove(clusterID) {
    if ( !(clusterID in this.pollers))
      return;

    const intervalID = this.pollers[clusterID];

    delete this.pollers[clusterID];
    window.clearInterval(intervalID);
  }

  removeAll() {
    let ids = Object.keys(this.pollers);
    ids.forEach((id) => {
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

