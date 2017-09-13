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
  LOGICAL_START_VIEW:       'LOGICAL_START_VIEW',
  LOGICAL_CLUSTER:          'LOGICAL_CLUSTER',
  LOGICAL_NAMESPACE:        'LOGICAL_NAMESPACE',
  LOGICAL_UDF_OVERVIEW:     'LOGICAL_UDF_OVERVIEW',
  LOGICAL_UDF:              'LOGICAL_UDF',
  LOGICAL_INDEXES_OVERVIEW: 'LOGICAL_INDEXES_OVERVIEW',
  LOGICAL_INDEX:            'LOGICAL_INDEX',
};

// type of the entity view types
export const VIEW_TYPE = Object.assign({}, LOGICAL_VIEW_TYPE, {
  CLUSTER:            'CLUSTER',
  INDEXES_OVERVIEW:   'INDEXES_OVERVIEW',
  INDEX:              'INDEX',
  NAMESPACE:          'NAMESPACE',
  NODE:               'NODE',
  SET_OVERVIEW:       'SET_OVERVIEW',
  SET:                'SET',
  UDF_OVERVIEW:       'UDF_OVERVIEW',
  UDF:                'UDF',
  START_VIEW:         'START_VIEW',
  ROLE:               'ROLE',
  USER:               'USER',
});

// the predefined database roles
export const DB_ROLES = {
  RD:        'read',
  RW:        'read-write',
  RWU:       'read-write-udf',
  USR_ADMN:  'user-admin',
  SYS_ADMN:  'sys-admin',
  DATA_ADMN: 'data-admin',
};

// polling interval
export const POLL_INTERVAL = 10*1000; // 10 seconds
