import { matchAndExtractEntityPathVariabes, getEntityPathViewType } from 'classes/urlAndViewSynchronizer';
import { VIEW_TYPE } from 'classes/constants';
import { toUDFOverviewPath, toUDFPath, toClusterPath, toNodePath, toNodeOverviewPath } from 'classes/entityTree';
import { toIndexesOverviewPath, toNamespacePath, toNamespaceOverviewPath, toSetPath, toSetOverviewPath } from 'classes/entityTree';

export const SHOW_LEFT_PANE = 'SHOW_LEFT_PANE';
export function showLeftPane() {
  return {
    type: SHOW_LEFT_PANE
  };
}

export const HIDE_LEFT_PANE = 'HIDE_LEFT_PANE';
export function hideLeftPane() {
  return {
    type: HIDE_LEFT_PANE
  };
}

export const INITIALIZE_VIEW = 'INITIALIZE_VIEW';
export function initView() {
  return {
    type: INITIALIZE_VIEW
  };
}

export const SELECT_CLUSTER_VIEW = 'SELECT_CLUSTER_VIEW';
export function selectCluster(clusterID, view) {
  const path = toClusterPath(clusterID);
  return {
    type: SELECT_CLUSTER_VIEW,
    entityPath: path,
    view: view,
    clusterID: clusterID,
  };
}

export const SELECT_NODE_VIEW = 'SELECT_NODE_VIEW';
export function selectNode(clusterID, nodeHost, view) {
  const path = toNodePath(clusterID, nodeHost);
  return {
    type: SELECT_NODE_VIEW,
    entityPath: path,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
  };
}

export const SELECT_NODE_OVERVIEW = 'SELECT_NODE_OVERVIEW';
export function selectNodeOverview(clusterID, view) {
  const path = toNodeOverviewPath(clusterID);
  return {
    type: SELECT_NODE_OVERVIEW,
    entityPath: path,
    view: view,
    clusterID: clusterID,
  };
}

export const SELECT_NAMESPACE_VIEW = 'SELECT_NAMESPACE_VIEW';
export function selectNamespace(clusterID, nodeHost, namespaceName, view) {
  const path = toNamespacePath(clusterID, nodeHost, namespaceName);
  return {
    type: SELECT_NAMESPACE_VIEW,
    entityPath: path,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
  };
}

export const SELECT_NAMESPACE_OVERVIEW = 'SELECT_NAMESPACE_OVERVIEW';
export function selectNamespaceOverview(clusterID, nodeHost, view) {
  const path = toNamespaceOverviewPath(clusterID, nodeHost);
  return {
    type: SELECT_NAMESPACE_OVERVIEW,
    entityPath: path,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
  };
}

export const SELECT_SET_VIEW = 'SELECT_SET_VIEW';
export function selectSet(clusterID, nodeHost, namespaceName, setName, view) {
  const path = toSetPath(clusterID, nodeHost, namespaceName, setName);
  return {
    type: SELECT_SET_VIEW,
    entityPath: path,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
    setName: setName,
  };
}

export const SELECT_SET_OVERVIEW = 'SELECT_SET_OVERVIEW';
export function selectSetOverview(clusterID, nodeHost, namespaceName, view) {
  const path = toSetOverviewPath(clusterID, nodeHost, namespaceName);
  return {
    type: SELECT_SET_OVERVIEW,
    entityPath: path,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
  };
}

export const SELECT_UDF_VIEW = 'SELECT_UDF_VIEW';
export function selectUDF(clusterID, udfName, view) {
  const path = toUDFPath(clusterID, udfName);
  return {
    type: SELECT_UDF_VIEW,
    entityPath: path,
    view: view,
    clusterID: clusterID,
    udfName: udfName,
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

export const SELECT_INDEXES_OVERVIEW = 'SELECT_INDEXES_OVERVIEW';
export function selectIndexesOverview(clusterID, view) {
  const path = toIndexesOverviewPath(clusterID);
  return {
    type: SELECT_INDEXES_OVERVIEW,
    clusterID: clusterID,
    entityPath: path,
    view: view
  };
}

export const SELECT_START_VIEW = 'SELECT_START_VIEW';
function selectStartView() {
  return {
    type: SELECT_START_VIEW
  };
}

export function selectPath(entityPath, view) {
  const e = matchAndExtractEntityPathVariabes(entityPath);
  const { clusterID, udfName, namespaceName, setName, nodeHost } = e;
  const viewType = getEntityPathViewType(entityPath);

  switch (viewType) {
  case VIEW_TYPE.UDF:
    return selectUDF(clusterID, udfName, view);

  case VIEW_TYPE.UDF_OVERVIEW:
    return selectUDFOverview(clusterID, view);

  case VIEW_TYPE.INDEXES_OVERVIEW:
    return selectIndexesOverview(clusterID, view);

  case VIEW_TYPE.CLUSTER:
    return selectCluster(clusterID, view);

  case VIEW_TYPE.NODE:
    return selectNode(clusterID, nodeHost, view);

  case VIEW_TYPE.NODE_OVERVIEW:
    return selectNodeOverview(clusterID, view);

  case VIEW_TYPE.NAMESPACE:
    return selectNamespace(clusterID, nodeHost, namespaceName, view);

  case VIEW_TYPE.NAMESPACE_OVERVIEW:
    return selectNamespaceOverview(clusterID, nodeHost, view);

  case VIEW_TYPE.SET:
    return selectSet(clusterID, nodeHost, namespaceName, setName, view);

  case VIEW_TYPE.SET_OVERVIEW:
    return selectSetOverview(clusterID, nodeHost, namespaceName, view);

  default:
    return selectStartView();
  }
}
