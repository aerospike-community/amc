import { combineReducers } from 'redux';
import clusters from './clusters';
import currentView from './currentView';
import entityTree from './entityTree';
import session from './session';

const app = combineReducers({
  clusters,    // the aerospike clusters
  currentView, // the current view of the app
  entityTree,  // state of the entity tree
  session,     // information of current session
});

export default app;
