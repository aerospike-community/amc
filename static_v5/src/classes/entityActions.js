// All the actions permissible on all the view types are defined here.

import { VIEW_TYPE, DB_ROLES as ROLES } from 'classes/constants';
import { canAccess, canAccessNamespace, canAccessSet } from 'classes/security';

function extractActions(obj) {
  let actions = {};
  for (let k in obj) {
    actions[k] = k;
  }
  return actions;
}

// Template for defining actions. Field not pertinent can be omitted.
// The order defined here is maintained. All properties are optional.
//
// Properties are
// state: the state of the cluster in which the action can be accessed
// dbRoles: the roles needed in the database to access the action 
// amcRoles: the roles needed by the user in amc 
// isEnterprise: should AMC be enterprise version 
//
// isDefault: the default view for the (role, state)
// isEndOfGrouping: end of grouping for the actions
// hideInContextMenu: (default: false) should the action be hidden in the 
// context menu

const clusterActions = {
  Connect: {
    isDefault: true,
    state: {
      isAuthenticated: false
    }
  },
  Overview: {
    isDefault: true,
    state: {
      isAuthenticated: true
    },
  },
  Latency: {
    state: {
      isAuthenticated: true
    },
  },
  Configuration: {
    state: {
      isAuthenticated: true
    },
  },
  XDR: {
    state: {
      isAuthenticated: true,
    },
  },
  Alerts: {
    state: {
      isAuthenticated: true
    },
    isEndOfGrouping: true,
  },
  Users: {
    state: {
      isAuthenticated: true,
      isSecure: true,
    },
    dbRoles: [ROLES.USR_ADMN],
  },
  Roles: {
    state: {
      isAuthenticated: true,
      isSecure: true,
    },
    dbRoles: [ROLES.USR_ADMN],
    isEndOfGrouping: true,
  },
  Edit: {},
  Delete: {
    isEndOfGrouping: true,
  },
  Disconnect: {
    state: {
      isAuthenticated: true
    },
    isEndOfGrouping: true,
  },
};
export const CLUSTER_ACTIONS = extractActions(clusterActions);

// udf
const udfActions = {
  View: {
    isDefault: true,
  },
  Edit: {
    hideInContextMenu: true,
    dbRoles: [ROLES.DATA_ADMN, ROLES.SYS_ADMN],
  },
  Create: {
    hideInContextMenu: true,
    dbRoles: [ROLES.DATA_ADMN, ROLES.SYS_ADMN],
  },
  Delete: {
    hideInContextMenu: true,
    dbRoles: [ROLES.DATA_ADMN, ROLES.SYS_ADMN],
  },
};
export const UDF_ACTIONS = extractActions(udfActions);

// roles
const roleActions = {
  Create: {
    hideInContextMenu: true,
    dbRoles: [ROLES.USR_ADMN],
  },
  Delete: {
    hideInContextMenu: true,
    dbRoles: [ROLES.USR_ADMN],
  },
  Edit: {
    hideInContextMenu: true,
    dbRoles: [ROLES.USR_ADMN],
  },
};
export const ROLE_ACTIONS = extractActions(roleActions);

// user
const userActions = {
  Create: {
    hideInContextMenu: true,
    dbRoles: [ROLES.USR_ADMN],
  },
  Delete: {
    hideInContextMenu: true,
    dbRoles: [ROLES.USR_ADMN],
  },
  Edit: {
    hideInContextMenu: true,
    dbRoles: [ROLES.USR_ADMN],
  },
};
export const USER_ACTIONS = extractActions(userActions);

// udf overview
const udfOverviewActions = {
  Overview: {
    isDefault: true,
  },
  Create: {
    dbRoles: [ROLES.DATA_ADMN, ROLES.SYS_ADMN],
  },
};
export const UDF_OVERVIEW_ACTIONS = extractActions(udfOverviewActions);

// node
const nodeActions = {
  View: {
    isDefault: true
  },
  Configuration: {
  },
  Latency: {},
  Jobs: {},
};
export const NODE_ACTIONS = extractActions(nodeActions);

// node overview
const nodeOverviewActions = {
  View: {
    isDefault: true
  }
};
export const NODE_OVERVIEW_ACTIONS = extractActions(nodeOverviewActions);

// namespace
const namespaceActions = {
  View: {
    isDefault: true
  },
  Latency: {},
  Configuration: {},
};
export const NAMESPACE_ACTIONS = extractActions(namespaceActions);

// namespace overview
const namespaceOverviewActions = {
  View: {
    isDefault: true
  }
};
export const NAMESPACE = extractActions(namespaceOverviewActions);

// set
const setActions = {
  View: {
    isDefault: true
  },
  Delete: {
    hideInContextMenu: true,
    dbRoles: [ROLES.RW, ROLES.RWU]
  },
};
export const SET_ACTIONS = extractActions(setActions);

// set overview
const setOverviewActions = {
  View: {
    isDefault: true
  }
};
export const SET_OVERVIEW_ACTIONS = extractActions(setOverviewActions);

// index actions
const indexActions = {
  View : {
    isDefault: true
  },
  Delete: {
    hideInContextMenu: true,
    dbRoles: [ROLES.DATA_ADMN, ROLES.SYS_ADMN],
  },
};
export const INDEX_ACTIONS = extractActions(indexActions);

// indexes overview
const indexesOverviewActions = {
  Overview: {
    isDefault: true
  }
}
export const INDEXES_OVERVIEW_ACTIONS = extractActions(indexesOverviewActions);

const logicalClusterActions = {
  Connect: {
    isDefault: true,
    state: {
      isAuthenticated: false
    }
  },
  View: {
    isDefault: true,
    isEndOfGrouping: true,
  },
  Edit: {},
  Delete: {
    isEndOfGrouping: true,
  },
  Disconnect: {
    state: {
      isAuthenticated: true
    },
    isEndOfGrouping: true,
  },
};
export const LOGICAL_CLUSTER_ACTIONS = extractActions(logicalClusterActions);

const logicalNamespaceActions = {
  View: {
    isDefault: true
  },
  Latency: {},
};
export const LOGICAL_NAMESPACE_ACTIONS = extractActions(logicalNamespaceActions);

const logicalNamespaceOverviewActions = {
  View: {
    isDefault: true
  }
};
export const LOGICAL_NAMESPACE_OVERVIEW_ACTIONS = extractActions(logicalNamespaceOverviewActions);

// -----------------------------------------------------------------------------
// Queries on the actions
// ----------------------

// get all the actions for the view type
function getActions(viewType) {
  if (viewType === VIEW_TYPE.CLUSTER)
    return clusterActions;

  if (viewType === VIEW_TYPE.UDF) 
    return udfActions;

  if (viewType === VIEW_TYPE.UDF_OVERVIEW) 
    return udfOverviewActions;

  if (viewType === VIEW_TYPE.NODE) 
    return nodeActions;

  if (viewType === VIEW_TYPE.NODE_OVERVIEW) 
    return nodeOverviewActions;

  if (viewType === VIEW_TYPE.NAMESPACE) 
    return namespaceActions;

  if (viewType === VIEW_TYPE.NAMESPACE_OVERVIEW) 
    return namespaceOverviewActions;

  if (viewType === VIEW_TYPE.SET) 
    return setActions;

  if (viewType === VIEW_TYPE.SET_OVERVIEW) 
    return setOverviewActions;

  if (viewType === VIEW_TYPE.INDEXES_OVERVIEW)
    return indexesOverviewActions;

  if (viewType === VIEW_TYPE.INDEX)
    return indexActions;

  if (viewType === VIEW_TYPE.LOGICAL_CLUSTER)
    return logicalClusterActions;

  if (viewType === VIEW_TYPE.LOGICAL_NAMESPACE)
    return logicalNamespaceActions;

  if (viewType === VIEW_TYPE.LOGICAL_NAMESPACE_OVERVIEW)
    return logicalNamespaceOverviewActions;

  if (viewType === VIEW_TYPE.ROLE)
    return roleActions;

  if (viewType === VIEW_TYPE.USER)
    return userActions;

  const msg = `Action for ${viewType} not found`;
  console.error(msg);
  throw new Error(msg);
}

// filter the permissible actions on the entity for the current user
function toContextMenuActions(actions, isPermitted) {
  const filtered = [];
  let group = [];

  for (let k in actions) {
    const action = actions[k];
    const { hideInContextMenu, isEndOfGrouping } = action;

    if (!hideInContextMenu && isPermitted(action))
      group.push(k);

    if (isEndOfGrouping && group.length > 0) {
      filtered.push(group);
      group = [];
    }
  }

  if (group.length > 0)
    filtered.push(group);

  return filtered;
}

// get all permited actions for the user 
// for an entity to show in the context menu
//
// returns an array of arrays based on the grouping.
// actions are grouped by the arrays. i.e
// [[View, Edit], [Add, Delete]]
export function contextMenuActions(entity) {
  const vt = entity.viewType;
  const isPermitted = (action) => {
    const ns = entity.namespaceName,
          set = entity.setName,
          id = entity.clusterID;

    if (action.hideContextMenu)
      return false;

    if (vt === VIEW_TYPE.NAMESPACE)
      return isAllowedOnNamespace(action, id, ns);

    if (vt === VIEW_TYPE.SET)
      return isAllowedOnSet(action, id, ns, set);

    return isAllowed(action, id);
  };
    
  const actions = getActions(vt);
  return toContextMenuActions(actions, isPermitted);
}

// get default action for the user for an entity to show in the context menu
export function defaultContextMenuAction(entity) {
  const actions = getActions(entity.viewType);

  const all = contextMenuActions(entity);
  let filtered = [];
  all.forEach((p) => {
    filtered = filtered.concat(p);
  });

  for (let k in actions) {
    const { isDefault } = actions[k];
    const i = filtered.findIndex((f) => f === k);

    if (isDefault && i !== -1)
      return k;
  }

  throw new Error('Default action not found');
}

function filterTheActions(actions, isPermitted) {
  const filtered = [];
  for (let k in actions) {
    const action = actions[k];
    if (isPermitted(action))
      filtered.push(k);
  }
  return filtered;
}

// use this method for all view types except namespace and set
function isAllowed(action, clusterID) {
  const { dbRoles, state, amcRoles, isEnterprise } = action;
  return canAccess(clusterID, dbRoles, state, isEnterprise, amcRoles);
}

function permittedActions(clusterID, viewType) {
  const all = getActions(viewType);
  const fn = (action) => isAllowed(action, clusterID);
  return filterTheActions(all, fn);
}

// filter the actions based on the user privileges
// NOTE: use this call for all view types except namespace or set
export function filterActions(actions = [], clusterID, viewType) {
  const permissible = permittedActions(clusterID, viewType);
  return actions.filter((action) => permissible.find((p) => p === action));
}

function isAllowedOnNamespace(action, clusterID, namespace) {
  const { dbRoles, state, amcRoles, isEnterprise } = action;
  return canAccessNamespace(clusterID, namespace, dbRoles, state, isEnterprise, 
            amcRoles);
}

function permittedNamespaceActions(clusterID, namespace) {
  const all = getActions(VIEW_TYPE.NAMESPACE);
  const fn = (action) => isAllowedOnNamespace(action, clusterID, namespace);
  return filterTheActions(all, fn);
}

// filter the namespace actions based on the user privileges
export function filterNamespaceActions(actions = [], clusterID, namespace) {
  const permissible = permittedNamespaceActions(clusterID, namespace);
  return actions.filter((action) => permissible.find((p) => p === action));
}

function isAllowedOnSet(action, clusterID, namespace, set) {
  const { dbRoles, state, amcRoles, isEnterprise } = action;
  return canAccessSet(clusterID, namespace, set, dbRoles, state, 
            isEnterprise, amcRoles);
}

function permittedSetActions(clusterID, namespace, set) {
  const all = getActions(VIEW_TYPE.SET);
  const fn = (action) => isAllowedOnSet(action, clusterID, namespace, set);
  return filterTheActions(all, fn);
}

// filter the set actions based on the user privileges
export function filterSetActions(actions = [], clusterID, namespace, set) {
  const permissible = permittedSetActions(clusterId, namespace, set);
  return actions.filter((action) => permissible.find((p) => p === action));
}

// return true if the current user can perform the action on the entity of
// the given view type
// NOTE: use this call for all view types except namespace or set
export function isPermissibleAction(action, clusterID, viewType) {
  const actions = permittedActions(clusterID, viewType);
  return actions.findIndex((a) => a === action) !== -1
}

// return true if the current user can perform the action on the namespace
export function isPermissibleNamespaceAction(action, clusterID, namespace) {
  const actions = permittedNamespaceActions(clusterID, namespace);
  return actions.findIndex((a) => a === action) !== -1;
}

// return true if the current user can perform the action on the set
export function isPermissibleSetAction(action, clusterID, namespace, set) {
  const actions = permittedSetActions(clusterID, namespace, set);
  return actions.findIndex((a) => a === action) !== -1;
}

