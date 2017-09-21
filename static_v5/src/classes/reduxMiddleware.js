import { AUTHENTICATED_CLUSTER_CONNECTION, DISCONNECT_CLUSTER_CONNECTION } from 'actions/clusters';
import { CLUSTER_CONNECTION_FETCHED, DELETE_CLUSTER_CONNECTION } from 'actions/clusters';
import { LOGOUT_USER, USER_AUTHENTICATION_SUCCESS } from 'actions/authenticate';

import { pollAlerts, stopPollingAlerts, stopPollingAllAlerts } from 'classes/pollAlerts';
import { pollCluster, stopPollingCluster, stopPollingAllClusters } from 'classes/pollClusters';
import { secureCluster, removeAllClusters, removeCluster, init as initSecurity } from 'classes/security';

// handle all _META_ functionality on actions through the
// redux middleware.
const pollingMiddleware = store => next => action => {
  const { dispatch } = store;

  handleAlertPolling(action, dispatch);
  handleClusterPollers(action, dispatch);
  handleSecurity(action);

  return next(action);
};

export default pollingMiddleware;

// ---- polling of alerts
function handleAlertPolling(action, dispatch) {
  switch (action.type) {
    case AUTHENTICATED_CLUSTER_CONNECTION:
    case CLUSTER_CONNECTION_FETCHED:
      pollAlerts(action.cluster.id, dispatch);
      break;
    case DISCONNECT_CLUSTER_CONNECTION:
      stopPollingAlerts(action.clusterID);
      break;
    case LOGOUT_USER:
      stopPollingAllAlerts();
      break;
  }
}

// ---- polling of clusters
function handleClusterPollers(action, dispatch) {
  let id;
  switch (action.type) {
    case AUTHENTICATED_CLUSTER_CONNECTION:
    case CLUSTER_CONNECTION_FETCHED:
      id = action.cluster.id;
      pollCluster(id, dispatch);
      break;
      
    case DISCONNECT_CLUSTER_CONNECTION:
    case DELETE_CLUSTER_CONNECTION:
      id = action.clusterID;
      stopPollingCluster(id);
      break;

    case LOGOUT_USER:
      stopPollingAllClusters();
      break;
  }
}

// ---- user permissible actions on each cluster
function handleSecurity(action, store) {
  let id;
  switch (action.type) {
    case USER_AUTHENTICATION_SUCCESS:
      initSecurity(action.roles, action.isEnterprise);
      break;

    case AUTHENTICATED_CLUSTER_CONNECTION:
    case CLUSTER_CONNECTION_FETCHED:
      id = action.cluster.id;
      secureCluster(id, action.cluster.clusterRoles, action.cluster.userRoles);
      break;

    case DISCONNECT_CLUSTER_CONNECTION:
      id = action.clusterID;
      removeCluster(id);
      break;

    case LOGOUT_USER:
      removeAllClusters();
      break;
  }
}

