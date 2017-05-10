import { ENTITY_NODE_EXPANDED, ENTITY_NODE_COLLAPSED } from '../actions/entityTree';

// state of the entity tree
export default function entityTree(state = {
    expanded: new Set()
  }, action) {
  const expanded = new Set(state.expanded);
  switch (action.type) {
    case ENTITY_NODE_EXPANDED:
      expanded.add(action.node.id);
      break;
    case ENTITY_NODE_COLLAPSED:
      expanded.delete(action.node.id);
      break;
    default:
      return state;
  }
  return Object.assign({}, state, {
    expanded: expanded,
  });
}
