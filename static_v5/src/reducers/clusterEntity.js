import { SELECT_NODE, SELECT_NAMESPACE, SELECT_CLUSTER, SELECT_ENTITY_VIEW } from '../actions/clusterEntity';
import { CLUSTER_ENTITY_TYPE } from '../classes/constants';

// the currently selected entity and view
export default function clusterEntity(state = {
    type: CLUSTER_ENTITY_TYPE.UNDEFINED,
    view: null, // the view of interest of the entity
    value: null // the entity
  }, action) {
  switch (action.type) {
    case SELECT_CLUSTER:
      return Object.assign({}, state, {
        type: CLUSTER_ENTITY_TYPE.CLUSTER,
        value: action.cluster
      });
    case SELECT_NODE:
      return Object.assign({}, state, {
        type: CLUSTER_ENTITY_TYPE.NODE,
        value: action.node
      });
    case SELECT_NAMESPACE:
      return Object.assign({}, state, {
        type: CLUSTER_ENTITY_TYPE.NAMESPACE,
        value: action.namespace
      });
    case SELECT_ENTITY_VIEW:
      return Object.assign({}, state, {
        type: CLUSTER_ENTITY_TYPE.NODE, // FIXME assign based on entity type
        view: action.view,
        value: action.entity,
      });
    default:
      return state;
  }
}
