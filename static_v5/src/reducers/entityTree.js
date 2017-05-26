import { ENTITY_NODE_EXPANDED, ENTITY_NODE_COLLAPSED } from 'actions/entityTree';

// state of the entity tree
// maintains a set of expanded nodes of the tree
export default function entityTree(state = {
    expanded: new Set()
  }, action) {
  const expanded = new Set(state.expanded);
  switch (action.type) {
    case ENTITY_NODE_EXPANDED:
      expanded.add(action.path);
      break;
    case ENTITY_NODE_COLLAPSED:
      expanded.delete(action.path);
      break;
    default:
      return state;
  }
  return Object.assign({}, state, {
    expanded: expanded,
  });
}
