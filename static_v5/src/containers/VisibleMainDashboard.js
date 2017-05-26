import { connect } from 'react-redux';

import MainDashboard from 'components/MainDashboard';
import { selectPath } from 'actions/currentView';

const  mapStateToProps = (state) => {
  return {
    currentView: state.currentView,
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



