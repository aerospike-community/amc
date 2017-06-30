import { connect } from 'react-redux';

import SetsOverview from 'components/set/SetsOverview';
import { selectSet } from 'actions/currentView';
import { SET_ACTIONS } from 'classes/entityActions';

const  mapStateToProps = (state) => {
  const { clusterID, nodeHost, namespaceName } = state.currentView;
  return {
    clusterID: clusterID,
    nodeHost: nodeHost,
    namespaceName: namespaceName
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onShowSet: (clusterID, nodeHost, namespaceName, setName) => {
      dispatch(selectSet(clusterID, nodeHost, namespaceName, setName, SET_ACTIONS.View));
    },
  };
}

const VisibleSetsOverview = connect(
    mapStateToProps,
    mapDispatchToProps
)(SetsOverview);

export default VisibleSetsOverview;



