// State of the view is also stored in redux.
// This provides functionality to keep the data and the url 
// in sync.

import createHistory from 'history/createHashHistory';
import { VIEW_TYPE } from './constants';
import { removeTrailingSlash, removeLeadingSlash } from './util';
import { initView, selectPath, selectStartView } from '../actions/currentView';
import { UDF, NODES, NAMESPACES, SETS }  from './entityTree';

const history = createHistory();
let currentPathname = null;

export function init(currentView, dispatch) {
  if (!currentView.isInitialized) {
    updateView(dispatch);
    dispatch(initView());
  }

  // update view on url change
  history.listen(() => updateView(dispatch));
}

function updateView(dispatch) {
  // prevent infinite loop
  const { pathname } = history.location;
  if (currentPathname === pathname)
    return;
  currentPathname = pathname;

  if (pathname === '/') {
    dispatch(selectStartView());
    return;
  }

  const path = toEntityPath(pathname);
  const entity = matchAndExtractVariables(pathname, 'url');
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
const pathDefinitions = [{
  url: 'cluster/:clusterID/view/:view',
  entityPath: ':clusterID'
}, {
  url: 'cluster/:clusterID/node/:nodeHost/view/:view',
  entityPath: ':clusterID/' + NODES + '/:nodeHost',
}];

// generate a url from the entity path for the view
function toURL(entityPath, view) {
  const match = findMatch(entityPath, 'entityPath');
  let variables = extractVariables(entityPath, match.entityPath);
  variables.view = view;
  return insertVariables(match.url, variables);
}

// generate an entity path from the url
function toEntityPath(url) {
  const match = findMatch(url, 'url');
  const variables = extractVariables(url, match.url);
  let path = insertVariables(match.entityPath, variables);
  return removeSlashes(path);
}

// match the entityPath and extract the variables fpr key url or entityPath
export function matchAndExtractVariables(path, key = 'entityPath') {
  const match = findMatch(path, key);
  return extractVariables(path, match[key]);
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

  let defItems = pathDefinition.split('/');
  let pathItems = path.split('/');
  
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
