export const ENTITY_NODE_EXPANDED = 'ENTITY_NODE_EXPANDED';
export function expandEntityNode(entity) {
  return {
    type: ENTITY_NODE_EXPANDED,
    entity: entity,
  };
}

export const ENTITY_NODE_COLLAPSED = 'ENTITY_NODE_COLLAPSED';
export function collapseEntityNode(entity) {
  return {
    type: ENTITY_NODE_COLLAPSED,
    entity: entity,
  };
}

