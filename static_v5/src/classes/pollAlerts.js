import { getAlerts } from 'api/alerts';
import { alertsFetched } from 'actions/alerts';

const Clusters = new Set(); // set of clusters to poll
const Interval = 10 * 1000; // 10 seconds

export function pollAlerts(clusterID, dispatch) {
  if (Clusters.has(clusterID))
    return;

  Clusters.add(clusterID);
  const poll = () => {
    getAlerts(clusterID)
      .then((alerts) => {
        dispatch(alertsFetched(clusterID, alerts));

        if (Clusters.has(clusterID))
          window.setTimeout(poll, Interval);
      })
      .catch(() => {
        if (Clusters.has(clusterID))
          window.setTimeout(poll, Interval);
      });
  };
  window.setTimeout(poll, Interval);
}

export function stopPollingAlerts(clusterID) {
  Clusters.delete(clusterID);
}

export function stopAllPollingOfAlerts() {
  Clusters.forEach((clusterID) => {
    stopPollingAlerts(clusterID);
  });
}

