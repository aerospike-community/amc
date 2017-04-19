import { combineReducers } from 'redux';
import { REQUEST_CLUSTERS, RECEIVE_CLUSTERS, CLUSTER_ENTITY_SELECTED } from '../actions';

function clusters(state = {
    isFetching: false,
    items: []
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
    case CLUSTER_ENTITY_SELECTED:
      console.log(CLUSTER_ENTITY_SELECTED);
      return state;
    default:
      return state;
  }
}

const app = combineReducers({
  clusters
});

export default app;
