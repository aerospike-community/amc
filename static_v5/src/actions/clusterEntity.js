export const SELECT_CLUSTER = 'SELECT_CLUSTER';
export const SELECT_NODE = 'SELECT_NODE';
export const SELECT_NAMESPACE = 'SELECT_NAMESPACE';
export const clusterEntitySelected = (entity) => {
  return {
    // TODO type, cluster, node, namespace based on entity
    type: SELECT_NODE,
    node: entity,
  };
};

export const SELECT_ENTITY_VIEW = 'SELECT_ENTITY_VIEW';
export const entityViewSelected = (entity, view) => {
  return {
    type: SELECT_ENTITY_VIEW,
    entity: entity,
    view: view
  };
}


