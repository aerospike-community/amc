import { SELECT_NODE_VIEW, SELECT_CLUSTER_VIEW, INITIALIZE_VIEW } from 'actions/currentView';
import { SELECT_START_VIEW, SELECT_NAMESPACE_VIEW, SELECT_SET_VIEW } from 'actions/currentView';
import { SELECT_NODE_OVERVIEW, SELECT_NAMESPACE_OVERVIEW, SELECT_SET_OVERVIEW } from 'actions/currentView';
import { SELECT_UDF_VIEW, SELECT_UDF_OVERVIEW, SHOW_LEFT_PANE, HIDE_LEFT_PANE } from 'actions/currentView';
import { SELECT_INDEXES_OVERVIEW, SELECT_CLUSTER_ON_STARTUP } from 'actions/currentView';
import { VIEW_TYPE } from 'classes/constants';
import { updateURL } from 'classes/urlAndViewSynchronizer';

const InitState = {
  // is the current view initialized
  isInitialized: false,

  // type of view
  // see VIEW_TYPE
  viewType: null,
  // the view of interest of the VIEW_TYPE
  // like Performance, Machine, Storage
  view: null, 

  // the whole path to the selected entity
  // Ex: clusterID/nodeHost/namespaceName
  selectedEntityPath: null,

  // whether the left pane holding the entity tree is shown
  showLeftPane: true,

  // the entities in the selected view
  // ex: namespace is identified by clusterID, nodeHost, namespaceName
  clusterID: null,
  nodeHost: null,
  namespaceName: null,
  setName:null,
  udfName: null,
};

// the current state of the view of the app
export default function currentView(state = InitState, action) {
  let updated;
  const wasInitialized = state.isInitialized;
  switch (action.type) {
    case SELECT_CLUSTER_VIEW:
      updated = Object.assign({}, state, {
        view: action.view,
        selectedEntityPath: action.entityPath,

        viewType: VIEW_TYPE.CLUSTER,
        clusterID: action.clusterID
      });
      break;

    case SELECT_CLUSTER_ON_STARTUP:
      updated = state;

      const v = state.viewType;
      if (v === null || v === VIEW_TYPE.START_VIEW) {
        updated = Object.assign({}, state, {
          view: action.view,
          selectedEntityPath: action.entityPath,

          viewType: VIEW_TYPE.CLUSTER,
          clusterID: action.clusterID
        });
      }
      break;

    case SELECT_NODE_VIEW:
      updated =  Object.assign({}, state, {
        view: action.view,
        selectedEntityPath: action.entityPath,

        viewType: VIEW_TYPE.NODE,
        clusterID: action.clusterID,
        nodeHost: action.nodeHost,
      });
      break;

    case SELECT_NODE_OVERVIEW:
      updated =  Object.assign({}, state, {
        view: action.view,
        selectedEntityPath: action.entityPath,

        viewType: VIEW_TYPE.NODE_OVERVIEW,
        clusterID: action.clusterID,
      });
      break;

    case SELECT_NAMESPACE_VIEW:
      updated = Object.assign({}, state, {
        view: action.view,
        selectedEntityPath: action.entityPath,

        viewType: VIEW_TYPE.NAMESPACE,
        clusterID: action.clusterID,
        nodeHost: action.nodeHost,
        namespaceName: action.namespaceName,
      });
      break;

    case SELECT_NAMESPACE_OVERVIEW:
      updated = Object.assign({}, state, {
        view: action.view, 
        selectedEntityPath: action.entityPath,

        viewType: VIEW_TYPE.NAMESPACE_OVERVIEW,
        clusterID: action.clusterID,
        nodeHost: action.nodeHost,
      });
      break;

    case SELECT_SET_VIEW:
      updated =  Object.assign({}, state, {
        view: action.view,
        selectedEntityPath: action.entityPath,

        viewType: VIEW_TYPE.SET,
        clusterID: action.clusterID,
        nodeHost: action.nodeHost,
        namespaceName: action.namespaceName,
        setName: action.setName,
      });
      break;

    case SELECT_SET_OVERVIEW:
      updated =  Object.assign({}, state, {
        view: action.view,
        selectedEntityPath: action.entityPath,

        viewType: VIEW_TYPE.SET,
        clusterID: action.clusterID,
        nodeHost: action.nodeHost,
        namespaceName: action.namespaceName,
      });
      break;

    case SELECT_UDF_VIEW:
      updated =  Object.assign({}, state, {
        view: action.view,
        selectedEntityPath: action.entityPath,

        viewType: VIEW_TYPE.UDF,
        clusterID: action.clusterID,
        udfName: action.udfName,
      });
      break;


    case SELECT_UDF_OVERVIEW:
      updated =  Object.assign({}, state, {
        view: action.view, 
        selectedEntityPath: action.entityPath,

        viewType: VIEW_TYPE.UDF_OVERVIEW,
        clusterID: action.clusterID,
      });
      break;

    case SELECT_INDEXES_OVERVIEW:
      updated =  Object.assign({}, state, {
        view: action.view,
        selectedEntityPath: action.entityPath,
        
        viewType: VIEW_TYPE.INDEXES_OVERVIEW,
        clusterID: action.clusterID,
      });
      break;

    case INITIALIZE_VIEW:
      updated = Object.assign({}, state, {
        isInitialized: true
      });
      break;

    case SELECT_START_VIEW:
      updated = Object.assign({}, InitState, {
        viewType: VIEW_TYPE.START_VIEW
      });
      break;

    case HIDE_LEFT_PANE:
      updated = Object.assign({}, state, {
        showLeftPane: false
      });
      break;

    case SHOW_LEFT_PANE:
      updated = Object.assign({}, state, {
        showLeftPane: true
      });
      break;

    default:
      updated = state;
      break;
  }

  // update the URL to reflect the view
  if (wasInitialized)
    updateURL(updated.selectedEntityPath, updated.view);
  
  return updated;
}
