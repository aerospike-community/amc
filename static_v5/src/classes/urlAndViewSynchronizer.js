// State of the view is also stored in redux.
// This provides functionality to keep the data and the url 
// in sync.

import createHistory from 'history/createHashHistory';
import { VIEW_TYPE } from './constants';
import { removeTrailingSlash, removeLeadingSlash } from './util';
import { initView, selectPath, selectStartView } from '../actions/currentView';
import { extractEntityInfo, toEntityPath } from './entityTree';

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
  const location = history.location;

  // prevent infinite loop
  if (currentPathname === location.pathname)
    return;
  currentPathname = location.pathname;

  const { pathname } = location;
  if (pathname === '/') {
    dispatch(selectStartView());
    return;
  }

  let entitites = {};
  let tokens = (removeLeadingSlash(pathname)).split('/');
  tokens.forEach((token) => {
    let i = token.indexOf('_');
    if (i === -1) {
      console.warn(`Unrecognized url param ${token}`);
      return;
    }

    let k = token.slice(0, i);
    let v = token.slice(i+1);
    entitites[k] = v;
  });

  let path = toEntityPath(entitites);
  dispatch(selectPath(path));
}

// sets the URL given the current view of the app
// Examples of paths are
//  for a cluster => cluster/:clusterID
//  for a node => cluster/:clusterID/nodes/:nodeHost
//  for a namespace => cluster/:clusterID/nodes/:nodeHost/namespaces/:namespace
//  for a set => cluster/:clusterID/nodes/:nodeHost/namespaces/:namespace/sets/:set
//
export function updateURL(selectedEntityPath, view) {
  let url = '/'; // leading slash is required to replace current url
                 // else it is appended to current url

  if (selectedEntityPath) {
    const e = extractEntityInfo(selectedEntityPath);
    url = joinURL(url, getClusterPath(e));
    url = joinURL(url, getNodePath(e));
    url = joinURL(url, getUDFPath(e));
    url = joinURL(url, getNamespacePath(e));
    url = joinURL(url, getSetPath(e));

    url = joinURL(url, getViewPath(view));
  }
  
  if (url === history.location.pathname)
    return;

  currentPathname = url;
  history.push(url);
}

// returns s + '/' + t with no duplicated forward slashes
function joinURL(s, t) {
  if (s.length === 0 && t.length === 0)
    return '';
  else if (s.length === 0)
    return t;
  else if (t.length === 0)
    return s;

  // also takes care of the case when s === '/'
  s = removeTrailingSlash(s);
  t = removeLeadingSlash(t);
  return s + '/' + t;
}

function getClusterPath(entity) {
  const { clusterID } = entity;
  if (!clusterID)
    return '';

  return 'clusterID_' + clusterID
}

function getNodePath(entity) {
  const { nodeHost } = entity;
  if (!nodeHost)
    return '';

  return 'nodeHost_' + nodeHost;
}

function getNamespacePath(entity) {
  const { namespaceName } = entity;
  if (!namespaceName)
    return '';

  return 'namespaceName_' + namespaceName;
}

function getSetPath(entity) {
  const { setName } = entity;
  if (!setName)
    return '';

  return 'setName_' + setName;
}

function getUDFPath(entity) {
  const { udfName } = entity;
  if (!udfName)
    return '';

  return 'udfName_' + udfName;
}

function getViewPath(view) {
  if (!view)
    return '';

  return 'view_' + view;
}

