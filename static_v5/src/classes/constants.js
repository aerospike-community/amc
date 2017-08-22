// type of cluster entities as returned by the server
export const ENTITY_TYPE = {
  CLUSTER:    'connection',
  INDEX:      'indexes',
  NAMESPACES: 'namespaces',
  NODES:      'nodes',
  SETS:       'sets',
  UDF:        'modules',
};

export const LOGICAL_VIEW_TYPE = {
  LOGICAL_START_VIEW: 'LOGICAL_START_VIEW',
  LOGICAL_CLUSTER: 'LOGICAL_CLUSTER',
  LOGICAL_NAMESPACE: 'LOGICAL_NAMESPACE',
  LOGICAL_NAMESPACE_OVERVIEW: 'LOGICAL_NAMESPACE_OVERVIEW',
};

// type of the entity view types
export const VIEW_TYPE = Object.assign({}, LOGICAL_VIEW_TYPE, {
  CLUSTER:            'CLUSTER',
  INDEXES_OVERVIEW:   'INDEXES_OVERVIEW',
  INDEX:              'INDEX',
  NAMESPACE:          'NAMESPACE',
  NAMESPACE_OVERVIEW: 'NAMESPACE_OVERVIEW',
  NODE:               'NODE',
  NODE_OVERVIEW:      'NODE_OVERVIEW',
  SET_OVERVIEW:       'SET_OVERVIEW',
  SET:                'SET',
  UDF_OVERVIEW:       'UDF_OVERVIEW',
  UDF:                'UDF',
  START_VIEW:         'START_VIEW',
});

// polling interval
export const POLL_INTERVAL = 10*1000; // 10 seconds
