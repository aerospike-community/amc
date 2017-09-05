import { getConnectionDetails } from 'api/clusterConnections';

const Clusters = new Set(); // set of clusters to poll
const Interval = 10 * 1000; // 10 seconds

export function pollCluster(clusterID) {
  if (Clusters.has(clusterID))
    return;

  Clusters.add(clusterID);
  const poll = () => {
    // stop if not in set
    if (!Clusters.has(clusterID))
      return;

    getConnectionDetails(clusterID)
      .then(() =>  window.setTimeout(poll, Interval))
      .catch(() => window.setTimeout(poll, Interval));
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
