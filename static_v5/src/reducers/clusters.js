import { REQUEST_CLUSTERS, RECEIVE_CLUSTERS } from '../actions/clusters';
import { ADDING_CLUSTER_CONNECTION, ADD_CLUSTER_CONNECTION, DISPLAY_ADD_CLUSTER_CONNECTION } from '../actions/clusters';

// all the cluster connections of the user
export default function clusters(state = {
    displayAddConnection: false,
    isFetching: false,
    items: [],
    isUpdating: false,
  }, action) {
  switch (action.type) {
    case REQUEST_CLUSTERS:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case RECEIVE_CLUSTERS:
      return Object.assign({}, state, {
        isFetching: false,
        items: action.clusters
      });
    case DISPLAY_ADD_CLUSTER_CONNECTION:
      return Object.assign({}, state, {
        displayAddConnection: action.display,
      });
    case ADD_CLUSTER_CONNECTION:
      return Object.assign({}, state, {
        displayAddConnection: false,
        items: [...state.items, action.connection],
        isUpdating: false,
      });
    case ADDING_CLUSTER_CONNECTION:
      return Object.assign({}, state, {
        isUpdating: true
      });
    default:
      return state;
  }
}

