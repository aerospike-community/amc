import { LOGOUT_USER } from 'actions/authenticate';
import { pollAlerts, stopPollingAlerts, stopAllPollingOfAlerts } from 'classes/pollAlerts';
import { AUTHENTICATED_CLUSTER_CONNECTION, DISCONNECT_CLUSTER_CONNECTION, CLUSTER_CONNECTION_FETCHED } from 'actions/clusters';

// handle all polling through middleware
const pollingMiddleware = store => next => action => {
  handleAlertPolling(action, store);

  return next(action);
};

export default pollingMiddleware;

// ---- polling of alerts
function handleAlertPolling(action, store) {
  switch (action.type) {
    case AUTHENTICATED_CLUSTER_CONNECTION:
    case CLUSTER_CONNECTION_FETCHED:
      pollAlerts(action.cluster.id, store.dispatch);
      break;
    case DISCONNECT_CLUSTER_CONNECTION:
      stopPollingAlerts(action.clusterID);
      break;
    case LOGOUT_USER:
      stopAllPollingOfAlerts();
      break;
  }
}

