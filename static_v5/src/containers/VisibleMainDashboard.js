import { connect } from 'react-redux';

import MainDashboard from 'components/MainDashboard';
import { selectPath } from 'actions/currentView';

const  mapStateToProps = (state) => {
  const { clusters } = state;
  const { clusterID } = state.currentView;

  // check if the selected cluster is connected
  let isClusterConnected = false;
  let clusterName;
  clusters.items.forEach((c) => {
    if (c.id === clusterID) {
      isClusterConnected = c.isAuthenticated === true;
      clusterName = c.name;
    }
  });

  return {
    currentView: state.currentView,
    isClusterConnected: isClusterConnected,
    clusterName: clusterName,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onSelectPath: (path, view) => {
      dispatch(selectPath(path, view));
    },
  };
}

const VisibleMainDashboard = connect(
    mapStateToProps,
    mapDispatchToProps
)(MainDashboard);

export default VisibleMainDashboard;



