// State of the view is stored in redux.
// This module provides functionality to keep the view and the url 
// in sync.
//
// On each view change update the url and vice versa.
// Only functionality needed is to convert between urls and the view.

import createHistory from 'history/createHashHistory';
import { VIEW_TYPE } from 'classes/constants';
import { removeTrailingSlash, removeLeadingSlash } from 'classes/util';
import { initView, selectView, selectStartView } from 'actions/currentView';

const History = createHistory();
let CurrentPathname = null;

// initialize the view based on url and set up the listener for url changes
export function init(currentView, dispatch) {
  if (!currentView.isInitialized) {
    updateView(dispatch, true);
    dispatch(initView());
  }

  // update view on url change
  History.listen(() => updateView(dispatch));
}

// update view based on the current url
function updateView(dispatch, isInit = false) {
  // prevent infinite loop
  const { pathname } = History.location;
  if (CurrentPathname === pathname && !isInit)
    return;
  CurrentPathname = pathname;

  const view = toView(pathname);
  dispatch(selectView(view));
}

// sets the URL given the current view of the app
export function updateURL(currentView) {
  const { viewType } = currentView;

  if (viewType === null)
    return;

  const def = matchDefinition(viewType);
  const url = insertVariables(def, currentView);
  
  if (url === History.location.pathname)
    return;

  CurrentPathname = url;
  History.push(url);
}

// get the url for the view type
function matchDefinition(viewType) {
  const i = URLDefinitions.findIndex((m) => m.viewType === viewType);
  
  if (i === -1)
    throw `No match found for viewType=${viewType}`;

  const url = URLDefinitions[i].url;
  return url;
}


// ----------------------------------------------
// A url definition defines a template for a url.
// It is made of items which can be strings or variables.
// A variable is defined by preceding it with ':' // i.e :variable.
// 
// A url definition can be matched with a url and the variables can be extracted. 
// Similarly variables can be inserted into the url definition and a url can 
// be generated.

const { START_VIEW, CLUSTER, UDF, UDF_OVERVIEW, NODE, NAMESPACE } = VIEW_TYPE;
const { SET_OVERVIEW, INDEX } = VIEW_TYPE;
const { SET, INDEXES_OVERVIEW } = VIEW_TYPE;
const { LOGICAL_CLUSTER, LOGICAL_NAMESPACE, LOGICAL_START_VIEW } = VIEW_TYPE;
const { LOGICAL_NAMESPACE_OVERVIEW } = VIEW_TYPE;

const URLDefinitions = [{
  url: '',
  viewType: START_VIEW
}, {
  url: '/physical-tree/cluster/:clusterID/:view',
  viewType: CLUSTER,
}, {
  url: '/physical-tree/udf-overview/:clusterID/:view',
  viewType: UDF_OVERVIEW,
}, {
  url: '/physical-tree/udf/:clusterID/:udfName/:view',
  viewType: UDF,
}, {
  url: '/physical-tree/index/:clusterID/:indexName/:view',
  viewType: INDEX,
}, {
  url: '/physical-tree/indexes-overview/:clusterID',
  viewType: INDEXES_OVERVIEW,
}, {
  url: '/physical-tree/node/:clusterID/:nodeHost/:view',
  viewType: NODE,
}, {
  url: '/physical-tree/namespace/:clusterID/:nodeHost/:namespaceName/:view',
  viewType: NAMESPACE, 
}, {
  url: '/physical-tree/set/:clusterID/:nodeHost/:namespaceName/:setName/:view',
  viewType: SET, 
}, {
  url: '/physical-tree/set-overview/:clusterID/:nodeHost/:namespaceName/:view',
  viewType: SET_OVERVIEW, 
}, {
  url: '/logical-tree',
  viewType: LOGICAL_START_VIEW
}, {
  url: '/logical-tree/cluster/:clusterID/:view',
  viewType: LOGICAL_CLUSTER,
}, {
  url: '/logical-tree/namespace-overview/:clusterID/:view',
  viewType: LOGICAL_NAMESPACE_OVERVIEW,
}, {
  url: '/logical-tree/namespace/:clusterID/:namespaceName/:view',
  viewType: LOGICAL_NAMESPACE,
}];

// convert the url to a view
function toView(url) {
  const def = findDefinition(url);
  let variables = extractVariables(url, def.url);
  variables.viewType = def.viewType;
  return variables;
}

// extract variables as specified by the url definition from the
// url
function extractVariables(url, urlDef) {
  if (!isDefinitionMatch(url, urlDef))
      throw new Error(`url=${url} and defintion=${urlDef} do not match`);

  url = removeSlashes(url);
  urlDef = removeSlashes(urlDef);

  let defItems = urlDef.split('/');
  let urlItems = url.split('/');
  
  let variables = {};
  for (let i = 0; i < defItems.length; i++) {
    const defItem = defItems[i];
    if (isVariable(defItem)) {
      let k = extractVariableName(defItem);
      variables[k] = urlItems[i];
    }
  }
  return variables;
}

// insert variables into the path definition and generate a path
function insertVariables(pathDefinition, variables) {
  pathDefinition = removeSlashes(pathDefinition);
  let defItems = pathDefinition.split('/');
  
  let path = '';
  for (let i = 0; i < defItems.length; i++) {
    const defItem = defItems[i];
    if (isVariable(defItem)) { // insert variable item
      let k = extractVariableName(defItem);
      let v = variables[k];
      path += '/' + v;

      if (!v) 
        throw new Error(`Variable=${k} not defined for path ${pathDefinition}`);
    } else { // insert string item
      path += '/' + defItem;
    }
  }
  return path;
}

// find a match for the url
// return the path definition
function findDefinition(url) {
  let match = null;
  for (let i = 0; i < URLDefinitions.length; i++) {
    let path = URLDefinitions[i];
    if (isDefinitionMatch(url, path.url)) {
      if (match !== null) // multiple matches
        throw `Multiple matches for url=${url} ${match.url} and ${path.url}`;
      match = path;
    }
  }

  if (match)
    return match;

  throw `No match found for url=${url}`;
}

// returns true if the path definition item is a variable
function isVariable(item) {
  return item.startsWith(':');
}

// return the variable name
function extractVariableName(item) {
  const i = ':'.length;
  return item.slice(i);
}

// does the url match the definition
function isDefinitionMatch(url, urlDef) {
  url = removeSlashes(url);
  urlDef = removeSlashes(urlDef);

  let defItems = urlDef.length === 0 ? [] : urlDef.split('/');
  let urlItems = url.length === 0 ? [] : url.split('/');
  
  if (defItems.length !== urlItems.length)
    return false;

  for (let i = 0; i < defItems.length; i++) {
    const defItem = defItems[i];
    if (isVariable(defItem))
      continue;

    if (defItem !== urlItems[i])
      return false;
  }
  return true;
}

// remove leading and trailing slashes in the path
function removeSlashes(path) {
  let p = removeLeadingSlash(path);
  return removeTrailingSlash(p);
}
