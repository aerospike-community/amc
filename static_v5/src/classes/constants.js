// type of cluster entities as returned by the server
export const ENTITY_TYPE = {
  CLUSTER: 'connection',
  NODES: 'nodes',
  NAMESPACES: 'namespaces',
  SETS: 'sets',
  UDF: 'modules',
};

// type of the entity view types
export const VIEW_TYPE = {
  CLUSTER: 'CLUSTER',
  NODE: 'NODE',
  NAMESPACE: 'NAMESPACE',
  SET: 'SET',
  UDF: 'UDF',
  NODE_OVERVIEW: 'NODE_OVERVIEW',
  NAMESPACE_OVERVIEW: 'NAMESPACE_OVERVIEW',
  SET_OVERVIEW: 'SET_OVERVIEW',
  UDF_OVERVIEW: 'UDF_OVERVIEW',

  START_VIEW: 'START_VIEW',
};

function makeObjects(arr, defaultView) {
  let obj = {default: defaultView};
  arr.forEach((a) => {
    obj[a] = a;
  });
  return obj;
}

// permissible actions on the udf
const udf_actions = ['View', 'Edit'];
export const UDF_ACTIONS = makeObjects(udf_actions, 'View');

// permissible actions on udf overview
const udf_overview_actions = ['View', 'Create'];
export const UDF_OVERVIEW_ACTIONS = makeObjects(udf_overview_actions, 'View');

// permissible actions on cluster connection
const cluster_actions = ['Connect', 'Disconnect', 'Edit', 'View', 'Overview'];
export const CLUSTER_ACTIONS = makeObjects(cluster_actions, 'View');

export const VIEW_TYPE_ACTIONS = {
  [VIEW_TYPE.CLUSTER]: cluster_actions, 
  [VIEW_TYPE.NODE]: ['Stats', 'Logs'],
  [VIEW_TYPE.NAMESPACE]: ['Stats', 'Import', 'Export', 'Create Index'],
  [VIEW_TYPE.SET]: ['Stats', 'Import', 'Export', 'Drop'],
  [VIEW_TYPE.UDF]: udf_actions,
  [VIEW_TYPE.NODE_OVERVIEW]: ['Add Node', 'Overview'],
  [VIEW_TYPE.NAMESPACE_OVERVIEW]: ['Add Namespace', 'Overview'],
  [VIEW_TYPE.SET_OVERVIEW]: ['Add Set', 'Overview'],
  [VIEW_TYPE.UDF_OVERVIEW]: udf_overview_actions,
};



