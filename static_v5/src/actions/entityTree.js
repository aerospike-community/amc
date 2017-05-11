export const ENTITY_NODE_EXPANDED = 'ENTITY_NODE_EXPANDED';
export function expandEntityNode(path) {
  return {
    type: ENTITY_NODE_EXPANDED,
    path: path
  };
}

export const ENTITY_NODE_COLLAPSED = 'ENTITY_NODE_COLLAPSED';
export function collapseEntityNode(path) {
  return {
    type: ENTITY_NODE_COLLAPSED,
    path: path
  };
}


