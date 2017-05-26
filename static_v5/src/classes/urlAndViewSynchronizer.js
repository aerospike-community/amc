// State of the view is also stored in redux.
// This module provides functionality to keep the data and the url 
// in sync.
//
// On each view change update the url and vice versa.
// Only functionality needed is to convert between urls and the view.
// The view in our case is captured completely by the path to the selected
// entity in the tree and the view (of the entity).
//
// SEE below for how the entity path and the url is kept in sync.

import createHistory from 'history/createHashHistory';
import { VIEW_TYPE } from 'classes/constants';
import { removeTrailingSlash, removeLeadingSlash } from 'classes/util';
import { initView, selectPath, selectStartView } from 'actions/currentView';

const history = createHistory();
let currentPathname = null;

// initialize the view based on url and set up the listener for url changes
export function init(currentView, dispatch) {
  if (!currentView.isInitialized) {
    updateView(dispatch);
    dispatch(initView());
  }

  // update view on url change
  history.listen(() => updateView(dispatch));
}

// update view based on the current url
function updateView(dispatch) {
  // prevent infinite loop
  const { pathname } = history.location;
  if (currentPathname === pathname)
    return;
  currentPathname = pathname;

  const path = urlToEntityPath(pathname);
  const entity = matchAndExtracURLVariabes(pathname);
  dispatch(selectPath(path, entity.view));
}

// sets the URL given the current view of the app
export function updateURL(selectedEntityPath, view) {
  let url = '/'; // leading slash is required to replace current url
                 // else it is appended to current url

  if (selectedEntityPath) 
    url = toURL(selectedEntityPath, view);
  
  if (url === history.location.pathname)
    return;

  currentPathname = url;
  history.push(url);
}

// ----------------------------------------------
// url and entity path synchronizer functionality


// A path definition defines a template for a path.
// It is made of items whih can be strings or variables.
// A variable is defined by preceding it with ':' // i.e :variable.
// 
// A path definition can be matched with a path and the variables
// can be extracted. 
// Variables can be inserted into the path definition
// and a path can be generated.

// Here we define path definitions for url and entity path. This helps 
// to convert a url to an entity path and vice versa.
//

const { START_VIEW, CLUSTER, UDF, UDF_OVERVIEW, NODE, NAMESPACE, SET, NODE_OVERVIEW, NAMESPACE_OVERVIEW, SET_OVERVIEW } = VIEW_TYPE;
const pathDefinitions = [{
  url: '',
  entityPath: '',
  viewType: START_VIEW
}, {
  url: 'cluster/:clusterID/:view',
  entityPath: ':clusterID',
  viewType: CLUSTER,
}, {
  url: 'udf-overview/:clusterID/:view',
  entityPath: ':clusterID/' + UDF,
  viewType: UDF_OVERVIEW,
}, {
  url: 'udf/:clusterID/:udfName/:view',
  entityPath: ':clusterID/' + UDF + '/:udfName',
  viewType: UDF,
}, {
  url: 'node/:clusterID/:nodeHost/:view',
  entityPath: ':clusterID/' + NODE + '/:nodeHost',
  viewType: NODE,
}, {
  url: 'namespace/:clusterID/:nodeHost/:namespaceName/:view',
  entityPath: ':clusterID/' + NODE + '/:nodeHost/' + NAMESPACE + '/:namespaceName',
  viewType: NAMESPACE, 
}, {
  url: 'set/:clusterID/:nodeHost/:namespaceName/:setName/:view',
  entityPath: ':clusterID/' + NODE + '/:nodeHost/' + NAMESPACE + '/:namespaceName/' + SET + '/:setName',
  viewType: SET, 
}, {
  url: 'node-overview/:clusterID/:view',
  entityPath: ':clusterID/' + NODE,
  viewType: NODE_OVERVIEW, 
}, {
  url: 'namespace-overview/:clusterID/:nodeHost/:view',
  entityPath: ':clusterID/' + NODE + '/:nodeHost/' + NAMESPACE,
  viewType: NAMESPACE_OVERVIEW, 
}, {
  url: 'set-overview/:clusterID/:nodeHost/:namespaceName/:view',
  entityPath: ':clusterID/' + NODE + '/:nodeHost/' + NAMESPACE + '/:namespaceName/' + SET,
  viewType: SET_OVERVIEW, 
}];

// generate a url from the entity path for the view
function toURL(entityPath, view) {
  const match = findMatch(entityPath, 'entityPath');
  let variables = extractVariables(entityPath, match.entityPath);
  variables.view = view;
  return insertVariables(match.url, variables);
}

// generate an entity path from the url
function urlToEntityPath(url) {
  const match = findMatch(url, 'url');
  const variables = extractVariables(url, match.url);
  let path = insertVariables(match.entityPath, variables);
  return removeSlashes(path);
}

// generate the entity path for the given view type
// entities is an object with 
// keys = [clusterID, nodeHost, udfName, namespaceName, setName]
export function toEntityPath(viewType, entities) {
  const pathDef = pathDefinitions.find((p) => p.viewType === viewType);
  if (!pathDef)
    throw new Error(`No match found for view type=${viewType}`);

  const path = insertVariables(pathDef.entityPath, entities);
  return removeLeadingSlash(path);
}

// match the entityPath and extract the entity path variables
export function matchAndExtractEntityPathVariabes(entityPath) {
  const match = findMatch(entityPath, 'entityPath');
  return extractVariables(entityPath, match.entityPath);
}

// get the view type for the entity path
export function getEntityPathViewType(entityPath) {
  const match = findMatch(entityPath, 'entityPath');
  return match.viewType;
}

// match the url and extract the path variables
export function matchAndExtracURLVariabes(url) {
  if (url.length === 0)
    return {};

  const match = findMatch(url, 'url');
  return extractVariables(url, match.url);
}

// extract variables from the path for the path definition
function extractVariables(path, pathDefinition) {
  if (!isDefinitionMatch(path, pathDefinition))
      throw new Error(`path=${path} and defintion=${pathDefinition} do not match`);

  path = removeSlashes(path);
  pathDefinition = removeSlashes(pathDefinition);

  let defItems = pathDefinition.split('/');
  let pathItems = path.split('/');
  
  let variables = {};
  for (let i = 0; i < defItems.length; i++) {
    const defItem = defItems[i];
    if (isVariable(defItem)) {
      let k = extractVariableName(defItem);
      variables[k] = pathItems[i];
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

// find a match for the path. key is url or entityPath
function findMatch(path, key) {
  let match = null;
  for (let i = 0; i < pathDefinitions.length; i++) {
    let def = pathDefinitions[i];
    if (isDefinitionMatch(path, def[key])) {
      if (match !== null) // multiple matches
        throw new Error(`multiple matches for path=${path} ${def[key]}, ${match[key]}`);
      match = def;
    }
  }

  if (match)
    return match;

  throw new Error(`No match found for path=${path} for ${key}`);
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

function isDefinitionMatch(path, pathDefinition) {
  path = removeSlashes(path);
  pathDefinition = removeSlashes(pathDefinition);

  let defItems = pathDefinition.length === 0 ? [] : pathDefinition.split('/');
  let pathItems = path.length === 0 ? [] : path.split('/');
  
  if (defItems.length !== pathItems.length)
    return false;

  for (let i = 0; i < defItems.length; i++) {
    const defItem = defItems[i];
    if (isVariable(defItem))
      continue;

    if (defItem !== pathItems[i])
      return false;
  }
  return true;
}

// remove leading and trailing slashes in the path
function removeSlashes(path) {
  let p = removeLeadingSlash(path);
  return removeTrailingSlash(p);
}
