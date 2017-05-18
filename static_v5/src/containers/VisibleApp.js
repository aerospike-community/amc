import { connect } from 'react-redux';

import App from '../components/App';
import { init as initAuth } from '../actions/authenticate';
import { init as initURLAndViewSync } from '../classes/urlAndViewSynchronizer';
import { showLeftPane } from '../actions/currentView';

const  mapStateToProps = (state) => {
  return {
    authentication: state.session.authentication,
    currentView: state.currentView,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onShowLeftPane: () => {
      dispatch(showLeftPane());
    },

    initAuth: () => {
      initAuth(dispatch);
    },

    initURLAndViewSync: (currentView) => {
      initURLAndViewSync(currentView, dispatch);
    }
  };
}

const VisibleApp = connect(
    mapStateToProps,
    mapDispatchToProps
)(App);

export default VisibleApp;


