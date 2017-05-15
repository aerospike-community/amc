import { matchAndExtractEntityPathVariabes } from '../classes/urlAndViewSynchronizer';

export const INITIALIZE_VIEW = 'INITIALIZE_VIEW';
export function initView() {
  return {
    type: INITIALIZE_VIEW
  };
}

export const SELECT_CLUSTER_VIEW = 'SELECT_CLUSTER_VIEW';
function selectCluster(clusterID, entityPath, view) {
  return {
    type: SELECT_CLUSTER_VIEW,
    entityPath: entityPath,
    view: view,
    clusterID: clusterID,
  };
}

export const SELECT_NODE_VIEW = 'SELECT_NODE_VIEW';
function selectNode(clusterID, nodeHost, entityPath, view) {
  return {
    type: SELECT_NODE_VIEW,
    entityPath: entityPath,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
  };
}

export const SELECT_NAMESPACE_VIEW = 'SELECT_NAMESPACE_VIEW';
function selectNamespace(clusterID, nodeHost, namespaceName, entityPath, view) {
  return {
    type: SELECT_NAMESPACE_VIEW,
    entityPath: entityPath,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
  };
}

export const SELECT_SET_VIEW = 'SELECT_SET_VIEW';
function selectSet(clusterID, nodeHost, namespaceName, setName, entityPath, view) {
  return {
    type: SELECT_SET_VIEW,
    entityPath: entityPath,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
    setName: setName,
  };
}

export const SELECT_UDF_VIEW = 'SELECT_UDF_VIEW';
function selectUDF(clusterID, udfName, entityPath, view) {
  return {
    type: SELECT_UDF_VIEW,
    entityPath: entityPath,
    view: view,
    clusterID: clusterID,
    udfName: udfName,
  };
}

export const SELECT_START_VIEW = 'SELECT_START_VIEW';
export function selectStartView() {
  return {
    type: SELECT_START_VIEW
  };
}

export function selectPath(entityPath, view) {
  const e = matchAndExtractEntityPathVariabes(entityPath);
  const { clusterID, udfName, namespaceName, setName, nodeHost } = e;

  if (e.udfName)
    return selectUDF(clusterID, udfName, entityPath, view);
  if (e.setName)
    return selectSet(clusterID, nodeHost, namespaceName, setName, entityPath, view);
  if (e.namespaceName)
    return selectNamespace(clusterID, nodeHost, namespaceName, entityPath, view);
  if (e.nodeHost)
    return selectNode(clusterID, nodeHost, entityPath, view);
  if (e.clusterID)
    return selectCluster(clusterID, entityPath, view);

  throw new Error(`Unrecognized entity path ${entityPath}`);
}
