import { VIEW_TYPE } from 'classes/constants';
import { CLUSTER_ACTIONS } from 'classes/entityActions';

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

// select a cluster view on startup
export const SELECT_CLUSTER_ON_STARTUP = 'SELECT_CLUSTER_ON_STARTUP';
export function selectClusterOnStartup(clusterID) {
  return {
    type: SELECT_CLUSTER_ON_STARTUP,
    view: CLUSTER_ACTIONS.Overview, // cluster overview
    clusterID: clusterID,
  };
}

export const SELECT_CLUSTER_VIEW = 'SELECT_CLUSTER_VIEW';
export function selectCluster(clusterID, view) {
  return {
    type: SELECT_CLUSTER_VIEW,
    view: view,
    clusterID: clusterID,
  };
}

export const SELECT_NODE_VIEW = 'SELECT_NODE_VIEW';
export function selectNode(clusterID, nodeHost, view) {
  return {
    type: SELECT_NODE_VIEW,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
  };
}

export const SELECT_NODE_OVERVIEW = 'SELECT_NODE_OVERVIEW';
export function selectNodeOverview(clusterID, view) {
  return {
    type: SELECT_NODE_OVERVIEW,
    view: view,
    clusterID: clusterID,
  };
}

export const SELECT_NAMESPACE_VIEW = 'SELECT_NAMESPACE_VIEW';
export function selectNamespace(clusterID, nodeHost, namespaceName, view) {
  return {
    type: SELECT_NAMESPACE_VIEW,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
  };
}

export const SELECT_NAMESPACE_OVERVIEW = 'SELECT_NAMESPACE_OVERVIEW';
export function selectNamespaceOverview(clusterID, nodeHost, view) {
  return {
    type: SELECT_NAMESPACE_OVERVIEW,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
  };
}

export const SELECT_SET_VIEW = 'SELECT_SET_VIEW';
export function selectSet(clusterID, nodeHost, namespaceName, setName, view) {
  return {
    type: SELECT_SET_VIEW,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
    setName: setName,
  };
}

export const SELECT_SET_OVERVIEW = 'SELECT_SET_OVERVIEW';
export function selectSetOverview(clusterID, nodeHost, namespaceName, view) {
  return {
    type: SELECT_SET_OVERVIEW,
    view: view,
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
  };
}

export const SELECT_UDF_VIEW = 'SELECT_UDF_VIEW';
export function selectUDF(clusterID, udfName, view) {
  return {
    type: SELECT_UDF_VIEW,
    view: view,
    clusterID: clusterID,
    udfName: udfName,
  };
}

export const SELECT_UDF_OVERVIEW = 'SELECT_UDF_OVERVIEW';
export function selectUDFOverview(clusterID, view) {
  return {
    type: SELECT_UDF_OVERVIEW,
    clusterID: clusterID,
    view: view
  };
}

export const SELECT_INDEXES_OVERVIEW = 'SELECT_INDEXES_OVERVIEW';
export function selectIndexesOverview(clusterID, view) {
  return {
    type: SELECT_INDEXES_OVERVIEW,
    clusterID: clusterID,
    view: view
  };
}

export const SELECT_INDEX = 'SELECT_INDEX';
export function selectIndex(clusterID, indexName, view) {
  return {
    type: SELECT_INDEX,
    clusterID: clusterID,
    indexName: indexName,
    view: view,
  };
}

export const SELECT_START_VIEW = 'SELECT_START_VIEW';
export function selectStartView() {
  return {
    type: SELECT_START_VIEW,
  };
}

export const SELECT_VIEW = 'SELECT_VIEW';
// select a newView.
// newView is an instance with the viewType and
// the entities of the view
export function selectView(newView) {
  return {
    type: SELECT_VIEW,
    newView: newView
  };
}

export const SELECT_VIEW_FOR_VIEW_TYPE = 'SELECT_VIEW_FOR_VIEW_TYPE';
// only change the view, keep the selected
// entity the same
export function selectViewForViewType(view) {
  return {
    type: SELECT_VIEW_FOR_VIEW_TYPE,
    view: view
  };
}

export function selectEntity(entity, view) {
  const { viewType, clusterID, udfName, namespaceName, setName, nodeHost, indexName } = entity;

  switch (viewType) {
  case VIEW_TYPE.UDF:
    return selectUDF(clusterID, udfName, view);

  case VIEW_TYPE.UDF_OVERVIEW:
    return selectUDFOverview(clusterID, view);

  case VIEW_TYPE.INDEXES_OVERVIEW:
    return selectIndexesOverview(clusterID, view);

  case VIEW_TYPE.INDEX:
    return selectIndex(clusterID, indexName, view);

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

