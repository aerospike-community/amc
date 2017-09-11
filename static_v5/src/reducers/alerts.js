import { ALERTS_FETCHED, CLEAR_ALERTS } from 'actions/alerts';

// maintain the alerts for the clusters
export default function(state = {
  // state is a map of cluster id to the alert object
  // where an alert = {
  //  isPolling: bool, // is the cluster being polled for alerts
  //  alerts: [],      // the alerts for the cluster
  // }
  }, action) {
  const { clusterID, alerts } = action;
  let cluster;

  switch (action.type) {
    case ALERTS_FETCHED:
      cluster = getCluster(state, clusterID);
      appendAlerts(cluster, alerts);
      return Object.assign({}, state, {
        [clusterID]: cluster
      });

    case CLEAR_ALERTS:
      cluster = getCluster(state, clusterID);
      cluster.alerts = [];
      return Object.assign({}, state, {
        [clusterID]: cluster
      });

    default: 
      return state;
  }
}

// append alerts to the cluster
function appendAlerts(cluster, alerts) {
  const toAppend = [];

  const time = latestTime(cluster.alerts);
  alerts.forEach((al) => {
    if (al.lastOccured > time)
      toAppend.push(al);
  });

  cluster.alerts = [].concat(cluster.alerts, toAppend);
}

// get the latest time of the alerts 
function latestTime(alerts) {
  let time = 0;
  alerts.forEach((al) => {
    if (al.lastOccured > time)
      time = al.lastOccured;
  });
  return time;
}

// get the cluster for the clusterID
function getCluster(state, clusterID) {
  const cluster = state[clusterID];
  if (cluster) {
    return Object.assign({}, cluster, {
      alerts: cluster.alerts.slice(), //copy
    });
  }

  return {
    isPolling: false,
    alerts: []
  }
}
