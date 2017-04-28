export const REQUEST_CLUSTERS = 'REQUEST_CLUSTERS';
function requestClusters() {
  return {
    type: REQUEST_CLUSTERS
  };
}

export const RECEIVE_CLUSTERS = 'RECEIVE_CLUSTERS';
function receiveClusters(clusters) {
  return {
    type: RECEIVE_CLUSTERS,
    clusters
  };
}

export const DISPLAY_ADD_CLUSTER_CONNECTION = 'DISPLAY_ADD_CLUSTER_CONNECTION';
export const displayAddClusterConnection = (display) => {
  return {
    type: DISPLAY_ADD_CLUSTER_CONNECTION,
    display: display,
  };
}

export const ADD_CLUSTER_CONNECTION = 'ADD_CLUSTER_CONNECTION';
export const ADDING_CLUSTER_CONNECTION = 'ADDING_CLUSTER_CONNECTION';
export function addClusterConnection(connection) {
  return function(dispatch) {
    dispatch({
      type: ADDING_CLUSTER_CONNECTION
    });

    // TODO send request to server
    setTimeout(() => {
      dispatch({
        type: ADD_CLUSTER_CONNECTION,
        connection: connection,
      });
    }, 2000);
  }
}


export function fetchClusters() {
  const dummyData = [{
    label: 'Cluster ONE',
    children: [{
      label: 'Cluster THREE',
      children: []
    }, {
      label: 'Cluster FOUR',
      children: []
    }]
  }, {
    label: 'Cluster TWO',
    children: []
  }];

  return function(dispatch) {
    dispatch(requestClusters());

    setTimeout(() => {
      dispatch(receiveClusters(dummyData));
    }, 200);
  }
}



