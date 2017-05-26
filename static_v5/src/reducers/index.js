import { combineReducers } from 'redux';
import clusters from 'reducers/clusters';
import currentView from 'reducers/currentView';
import entityTree from 'reducers/entityTree';
import session from 'reducers/session';

import { LOGOUT_USER } from 'actions/authenticate';

const app = combineReducers({
  clusters,    // the aerospike clusters
  currentView, // the current view of the app
  entityTree,  // state of the entity tree
  session,     // information of current session
});

// see https://stackoverflow.com/questions/35622588/how-to-reset-the-state-of-a-redux-store/35641992#35641992
const rootReducer = (state, action) => {
  if (action.type === LOGOUT_USER)
    state = undefined;

  return app(state, action);
}

export default rootReducer;
