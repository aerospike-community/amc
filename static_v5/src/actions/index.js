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

export const CLUSTER_ENTITY_SELECTED = 'CLUSTER_ENTITY_SELECTED';
export const clusterEntitySelected = (id) => {
  return {
    type: 'CLUSTER_ENTITY_SELECTED',
    id
  };
};

export function fetchClusters() {
  const dummyData = [{
    id: 'Cluster ONE',
    label: 'Cluster ONE',
    children: [{
      id: 'Cluster ONE',
      label: 'Cluster ONE',
      children: []
    }, {
      id: 'Cluster TWO',
      label: 'Cluster TWO',
      children: []
    }]
  }, {
    id: 'Cluster TWO',
    label: 'Cluster TWO',
    children: []
  }];

  return function(dispatch) {
    dispatch(requestClusters());

    setTimeout(() => {
      dispatch(receiveClusters(dummyData));
    }, 2000);
  }
}


