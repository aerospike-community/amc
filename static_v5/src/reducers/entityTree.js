import { ENTITY_NODE_EXPANDED, ENTITY_NODE_COLLAPSED } from 'actions/entityTree';
import EntitySet from 'classes/EntitySet';

// state of the entity tree
// maintains a set of expanded nodes of the tree
export default function entityTree(state = {
    expanded: new EntitySet(),
  }, action) {
  const expanded = state.expanded.clone();
  switch (action.type) {
    case ENTITY_NODE_EXPANDED:
      expanded.add(action.entity);
      break;

    case ENTITY_NODE_COLLAPSED:
      expanded.delete(action.entity);
      break;

    default:
      return state;
  }

  return Object.assign({}, state, {
    expanded: expanded,
  });
}

