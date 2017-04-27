import { combineReducers } from 'redux';
import clusters from './clusters';
import clusterEntity from './clusterEntity';
import entityTree from './entityTree';
import session from './session';

const app = combineReducers({
  clusters, // the aerospike clusters
  clusterEntity, // the selected cluster entity
  entityTree, // state of the entity tree
  session, // information of current session
});

export default app;
