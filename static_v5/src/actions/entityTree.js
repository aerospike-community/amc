export const ENTITY_NODE_EXPANDED = 'ENTITY_NODE_EXPANDED';
export function expandEntityNode(node) {
  return {
    type: ENTITY_NODE_EXPANDED,
    node: node
  };
}

export const ENTITY_NODE_COLLAPSED = 'ENTITY_NODE_COLLAPSED';
export function collapseEntityNode(node) {
  return {
    type: ENTITY_NODE_COLLAPSED,
    node: node
  };
}


