import { SELECT_NODE_VIEW, SELECT_CLUSTER_VIEW, INITIALIZE_VIEW } from '../actions/currentView';
import { SELECT_START_VIEW, SELECT_NAMESPACE_VIEW, SELECT_SET_VIEW } from '../actions/currentView';
import { VIEW_TYPE } from '../classes/constants';
import { updateURL } from '../classes/urlAndViewSynchronizer';

// the current view of the app
export default function currentView(state = {
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
  }, action) {
  let updated;
  const wasInitialized = state.isInitialized;
  switch (action.type) {
    case SELECT_CLUSTER_VIEW:
      updated = Object.assign({}, state, {
        viewType: VIEW_TYPE.CLUSTER,
        view: action.view,
        selectedEntityPath: action.entityPath,
      });
      break;

    case SELECT_NODE_VIEW:
      updated =  Object.assign({}, state, {
        viewType: VIEW_TYPE.NODE,
        view: action.view,
        selectedEntityPath: action.entityPath,
      });
      break;

    case SELECT_NAMESPACE_VIEW:
      updated = Object.assign({}, state, {
        viewType: VIEW_TYPE.NAMESPACE,
        view: action.view,
        selectedEntityPath: action.entityPath,
      });
      break;

    case SELECT_SET_VIEW:
      updated =  Object.assign({}, state, {
        viewType: VIEW_TYPE.SET,
        view: action.view,
        selectedEntityPath: action.entityPath,
      });
      break;


    case INITIALIZE_VIEW:
      updated = Object.assign({}, state, {
        isInitialized: true
      });
      break;

    case SELECT_START_VIEW:
      updated = Object.assign({}, state, {
        view: VIEW_TYPE.START_VIEW
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
