import { matchAndExtractEntityPathVariabes, getEntityPathViewType } from '../classes/urlAndViewSynchronizer';
import { VIEW_TYPE } from '../classes/constants';
import { toUDFOverviewPath } from '../classes/entityTree';

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
function selectStartView() {
  return {
    type: SELECT_START_VIEW
  };
}

export const SELECT_UDF_OVERVIEW = 'SELECT_UDF_OVERVIEW';
export function selectUDFOverview(clusterID, view) {
  const path = toUDFOverviewPath(clusterID);
  return {
    type: SELECT_UDF_OVERVIEW,
    clusterID: clusterID,
    entityPath: path,
    view: view
  };
}

export function selectPath(entityPath, view) {
  const e = matchAndExtractEntityPathVariabes(entityPath);
  const { clusterID, udfName, namespaceName, setName, nodeHost } = e;
  const viewType = getEntityPathViewType(entityPath);

  switch (viewType) {
  case VIEW_TYPE.UDF:
    return selectUDF(clusterID, udfName, entityPath, view);

  case VIEW_TYPE.UDF_OVERVIEW:
    return selectUDFOverview(clusterID, view);

  case VIEW_TYPE.CLUSTER:
    return selectCluster(clusterID, entityPath, view);

  case VIEW_TYPE.NODE:
    return selectNode(clusterID, nodeHost, entityPath, view);

  case VIEW_TYPE.NAMESPACE:
    return selectNamespace(clusterID, nodeHost, namespaceName, entityPath, view);

  case VIEW_TYPE.SET:
    return selectSet(clusterID, nodeHost, namespaceName, setName, entityPath, view);

  default:
    return selectStartView();
  }
}
