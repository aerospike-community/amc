import { connect } from 'react-redux';

import SetView from 'components/set/SetView';
import { selectSet, selectSetOverview } from 'actions/currentView';
import { SET_OVERVIEW_ACTIONS } from 'classes/entityActions';

const  mapStateToProps = (state) => {
  const { clusterID, nodeHost, namespaceName, setName, view } = state.currentView;
  return {
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
    setName: setName,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onDeleteSuccess: (clusterID, nodeHost, namespaceName, setName) => {
      dispatch(selectSetOverview(clusterID, nodeHost, namespaceName, SET_OVERVIEW_ACTIONS.View));
    },
  };
}

const VisibleSetView = connect(
    mapStateToProps,
    mapDispatchToProps
)(SetView);

export default VisibleSetView;





