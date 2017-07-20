import { connect } from 'react-redux';

import MainDashboard from 'components/MainDashboard';
import { selectViewForViewType } from 'actions/currentView';

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

  const { viewConnection } = clusters;
  return {
    currentView: state.currentView,
    isClusterConnected: isClusterConnected,
    clusterName: clusterName,

    displayViewConnection: viewConnection.display && !viewConnection.isEdit,
    displayEditConnection: viewConnection.display && viewConnection.isEdit,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onChangeView: (view) => {
      dispatch(selectViewForViewType(view));
    },
  };
}

const VisibleMainDashboard = connect(
    mapStateToProps,
    mapDispatchToProps
)(MainDashboard);

export default VisibleMainDashboard;



