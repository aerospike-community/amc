export const ENTITY_NODE_EXPANDED = 'ENTITY_NODE_EXPANDED';
export const expandEntityNode = (node) => {
  return {
    type: ENTITY_NODE_EXPANDED,
    node: node
  };
}

export const ENTITY_NODE_COLLAPSED = 'ENTITY_NODE_COLLAPSED';
export const collapseEntityNode = (node) => {
  return {
    type: ENTITY_NODE_COLLAPSED,
    node: node
  };
}


