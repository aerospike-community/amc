import { REQUEST_CLUSTERS, RECEIVE_CLUSTERS } from '../actions/clusters';
import { ADDING_CLUSTER_CONNECTION, ADD_CLUSTER_CONNECTION, DISPLAY_ADD_CLUSTER_CONNECTION } from '../actions/clusters';

// all the cluster connections of the user
export default function clusters(state = {
    newConnection: {
      isAdding: false, // adding a new connection
      isUpdating: false,
    },
    isFetching: false,
    items: [],
  }, action) {
  let newConnection;
  switch (action.type) {
    case REQUEST_CLUSTERS:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case RECEIVE_CLUSTERS:
      return Object.assign({}, state, {
        isFetching: false,
        items: action.clusters || [],
      });
    case DISPLAY_ADD_CLUSTER_CONNECTION:
      newConnection = Object.assign({}, state.newConnection, {
        isAdding: true
      });
      return Object.assign({}, state, {
        newConnection: newConnection
      });
    case ADD_CLUSTER_CONNECTION:
      newConnection = Object.assign({}, state.newConnection, {
        isAdding: false,
        isUpdating: false,
      });
      return Object.assign({}, state, {
        newConnection: newConnection,
        items: [...state.items, action.connection],
      });
    case ADDING_CLUSTER_CONNECTION:
      newConnection = Object.assign({}, state.newConnection, {
        isUpdating: true,
      });
      return Object.assign({}, state, {
        newConnection: newConnection
      });
    default:
      return state;
  }
}

