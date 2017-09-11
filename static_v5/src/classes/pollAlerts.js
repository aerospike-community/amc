import { getAlerts } from 'api/alerts';
import { alertsFetched } from 'actions/alerts';
import { timeout } from 'classes/util';

const Clusters = new Set(); // set of clusters to poll
const Interval = 10 * 1000; // 10 seconds

export function pollAlerts(clusterID, dispatch) {
  if (Clusters.has(clusterID))
    return;

  Clusters.add(clusterID);
  const poll = () => {
    getAlerts(clusterID)
      .then((response) => {
        const { notifications } = response;
        dispatch(alertsFetched(clusterID, notifications));

        if (Clusters.has(clusterID))
          timeout(poll, Interval);
      })
      .catch(() => {
        if (Clusters.has(clusterID))
          timeout(poll, Interval);
      });
  };
  poll();
}

export function stopPollingAlerts(clusterID) {
  Clusters.delete(clusterID);
}

export function stopPollingAllAlerts() {
  Clusters.forEach((clusterID) => {
    stopPollingAlerts(clusterID);
  });
}

