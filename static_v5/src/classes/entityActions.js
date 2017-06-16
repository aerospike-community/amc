// entityActions maintains the actions permissible for
// each entity.

import { VIEW_TYPE } from 'classes/constants';

function extractActions(obj) {
  let actions = {};
  for (let k in obj) {
    actions[k] = k;
  }
  return actions;
}

// Template for defining actions. Field not pertinent can be omitted.
// The order defined here is maintained.
//
// Properties are
// roles: the roles needed to access the action
// state: the state of the entity in which the action can be accessed
// isDefault: the default view for the (role, state)
// isEndOfGrouping: end of grouping for the actions
//
const clusterActions = {
  Connect: {
    isDefault: true,
    state: {
      isAuthenticated: false
    }
  },
  Disconnect: {
    state: {
      isAuthenticated: true
    },
    isEndOfGrouping: true,
  },
  Edit: {},
  Overview: {
    isDefault: true,
    state: {
      isAuthenticated: true
    }
  },
};
export const CLUSTER_ACTIONS = extractActions(clusterActions);

// udf
const udfActions = {
  View: {
    isDefault: true,
  },
  Edit: {},
  Delete: {},
};
export const UDF_ACTIONS = extractActions(udfActions);

// udf overview
const udfOverviewActions = {
  View: {
    isDefault: true,
  },
  Create: {}
};
export const UDF_OVERVIEW_ACTIONS = extractActions(udfOverviewActions);

// node
const nodeActions = {
  View: {
    isDefault: true
  }
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
  }
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
  }
};
export const SET_ACTIONS = extractActions(setActions);

// set overview
const setOverviewActions = {
  View: {
    isDefault: true
  }
};
export const SET_OVERVIEW_ACTIONS = extractActions(setOverviewActions);

// indexes overview
const indexesOverviewActions = {
  Overview: {
    isDefault: true
  }
}
export const INDEXES_OVERVIEW_ACTIONS = extractActions(indexesOverviewActions);

// TODO implement this
function satisfiesRoles(requiredRoles, userRoles) {
  requiredRoles = requiredRoles || [];
  return true;
}

// check for state compatibility
function inPermissibleState(requiredState, state) {
  requiredState = requiredState || {};
  for (let k in requiredState) {
    let r = requiredState[k];
    let s = state[k];
    if (s === undefined) {
      if (r)
        return false;
    } else if (s !== r) {
      return false;
    }
  }
  return true;
}

// filter the permissible actions based on roles and state
function filterActions(actions, entity, userRoles) {
  let filtered = [],
      group = [];
  for (let k in actions) {
    let {roles, state, isEndOfGrouping} = actions[k];

    if (inPermissibleState(state, entity) && satisfiesRoles(roles, userRoles)) 
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

function getDefaultAction(actions, entity, userRoles) {
  for (let k in actions) {
    let {roles, state, isDefault} = actions[k];
    if (isDefault && inPermissibleState(state, entity) && satisfiesRoles(roles, userRoles))
      return k;
  }

  throw new Error('Default action not found');
}

// get action based on view type
function viewTypeAction(viewType) {
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
    return nodeOverviewActions;

  if (viewType === VIEW_TYPE.NAMESPACE_OVERVIEW) 
    return namespaceOverviewActions;

  if (viewType === VIEW_TYPE.SET) 
    return setActions;

  if (viewType === VIEW_TYPE.SET_OVERVIEW) 
    return setOverviewActions;

  if (viewType === VIEW_TYPE.INDEXES_OVERVIEW)
    return indexesOverviewActions;

  const msg = `Action for ${viewType} not found`;
  console.error(msg);
  throw new Error(msg);
}

// get all permissible actions for the user 
// for an entity of the given view type
//
// returns an array of arrays based on the grouping.
// actions are grouped by the arrays. i.e
// [[View, Edit], [Add, Delete]]
export function actions(viewType, entity, userRoles) {
  let actions = viewTypeAction(viewType);
  return filterActions(actions, entity, userRoles);
}

// get default action for the user for an entity of 
// the given view type
export function defaultAction(viewType, entity, userRoles) {
  let actions = viewTypeAction(viewType);
  return getDefaultAction(actions, entity, userRoles);
}

