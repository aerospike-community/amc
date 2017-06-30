import { connect } from 'react-redux';

import SetDashboard from 'components/set/SetDashboard';
import { selectSet, selectSetOverview } from 'actions/currentView';
import { SET_OVERVIEW_ACTIONS } from 'classes/entityActions';

const  mapStateToProps = (state) => {
  const { clusterID, nodeHost, namespaceName, setName, view } = state.currentView;
  return {
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName,
    setName: setName,
    view: view,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onShowSetOverview: (clusterID, nodeHost, namespaceName) => {
      dispatch(selectSetOverview(clusterID, nodeHost, namespaceName, SET_OVERVIEW_ACTIONS.View));
    },

    onSetSelect: (clusterID, nodeHost, namespaceName, setName, view) => {
      dispatch(selectSet(clusterID, nodeHost, namespaceName, setName, view));
    },
  };
}

const VisibleSetsOverview = connect(
    mapStateToProps,
    mapDispatchToProps
)(SetDashboard);

export default VisibleSetsOverview;




