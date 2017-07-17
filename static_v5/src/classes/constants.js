// type of cluster entities as returned by the server
export const ENTITY_TYPE = {
  CLUSTER: 'connection',
  NODES: 'nodes',
  NAMESPACES: 'namespaces',
  SETS: 'sets',
  UDF: 'modules',
  INDEX: 'indexes',
};

// type of the entity view types
export const VIEW_TYPE = {
  CLUSTER: 'CLUSTER',
  NODE: 'NODE',
  NAMESPACE: 'NAMESPACE',
  SET: 'SET',
  UDF: 'UDF',
  INDEX: 'INDEX',
  NODE_OVERVIEW: 'NODE_OVERVIEW',
  NAMESPACE_OVERVIEW: 'NAMESPACE_OVERVIEW',
  SET_OVERVIEW: 'SET_OVERVIEW',
  UDF_OVERVIEW: 'UDF_OVERVIEW',
  INDEXES_OVERVIEW: 'INDEXES_OVERVIEW',

  START_VIEW: 'START_VIEW',
};

// polling interval
export const POLL_INTERVAL = 10*1000; // 5000 milliseconds
