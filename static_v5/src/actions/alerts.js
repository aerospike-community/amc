import { getAlerts } from 'api/alerts';

export const ALERTS_FETCHED = 'ALERTS_FETCHED';
export function alertsFetched(clusterID, alerts = []) {
  return {
    type: ALERTS_FETCHED,
    clusterID: clusterID,
    alerts: alerts,
  };
}

export const CLEAR_ALERTS = 'CLEAR_ALERTS';
export function clearAlerts(clusterID) {
  return {
    type: CLEAR_ALERTS,
    clusterID: clusterID,
  };
}

export function fetchAlerts(clusterID, lastID = null) {
  return (dispatch) => {
    getAlerts(clusterID, lastID)
      .then((alerts) => {
        dispatch(alertsFetched(clusterID, alerts));
      });
  };
}
