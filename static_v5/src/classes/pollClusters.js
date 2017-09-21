import {  getClusterEntityTree } from 'api/clusterConnections';
import { clusterDetails } from 'actions/clusters';
import { timeout } from 'classes/util';

const Clusters = new Set(); // set of clusters to poll
const Interval = 4 * 1000; 

export function pollCluster(clusterID, dispatch) {
  if (Clusters.has(clusterID))
    return;

  Clusters.add(clusterID);
  const poll = () => {
    // stop if not in set
    if (!Clusters.has(clusterID))
      return;

    getClusterEntityTree(clusterID)
      .then((cluster) =>  {
        dispatch(clusterDetails(cluster));
        timeout(poll, Interval, false);
      })
      .catch(() => timeout(poll, Interval, false));
  };
  poll();
}

export function stopPollingCluster(clusterID) {
  Clusters.delete(clusterID);
}

export function stopPollingAllClusters() {
  Clusters.forEach((clusterID) => {
    stopPollingCluster(clusterID);
  });
}
