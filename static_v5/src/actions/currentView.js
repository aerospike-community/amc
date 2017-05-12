import { matchAndExtractVariables } from '../classes/urlAndViewSynchronizer';

export const INITIALIZE_VIEW = 'INITIALIZE_VIEW';
export function initView() {
  return {
    type: INITIALIZE_VIEW
  };
}

export const SELECT_CLUSTER_VIEW = 'SELECT_CLUSTER_VIEW';
function selectCluster(entityPath, view) {
  return {
    type: SELECT_CLUSTER_VIEW,
    entityPath: entityPath,
    view: view
  };
}

export const SELECT_NODE_VIEW = 'SELECT_NODE_VIEW';
function selectNode(entityPath, view) {
  return {
    type: SELECT_NODE_VIEW,
    entityPath: entityPath,
    view: view
  };
}

export const SELECT_NAMESPACE_VIEW = 'SELECT_NAMESPACE_VIEW';
function selectNamespace(entityPath, view) {
  return {
    type: SELECT_NAMESPACE_VIEW,
    entityPath: entityPath,
    view: view
  };
}

export const SELECT_SET_VIEW = 'SELECT_SET_VIEW';
function selectSet(entityPath, view) {
  return {
    type: SELECT_SET_VIEW,
    entityPath: entityPath,
    view: view
  };
}

export const SELECT_UDF_VIEW = 'SELECT_UDF_VIEW';
function selectUDF(entityPath, view) {
  return {
    type: SELECT_UDF_VIEW,
    entityPath: entityPath,
    view: view
  };
}

export const SELECT_START_VIEW = 'SELECT_START_VIEW';
export function selectStartView() {
  return {
    type: SELECT_START_VIEW
  };
}

export function selectPath(entityPath, view) {
  const entity = matchAndExtractVariables(entityPath, 'entityPath');

  if (entity.udfName)
    return selectUDF(entityPath, view);
  if (entity.setName)
    return selectSet(entityPath, view);
  if (entity.namespaceName)
    return selectNamespace(entityPath, view);
  if (entity.nodeHost)
    return selectNode(entityPath, view);
  if (entity.clusterID)
    return selectCluster(entityPath, view);

  throw new Error(`Unrecognized entity path ${entityPath}`);
}
