import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';

import VisibleAuthenticateModal from '../containers/VisibleAuthenticateModal';
import VisibleClusterConnections from '../containers/VisibleClusterConnections';
import MainDashboard from './MainDashboard';
import Header from './Header';
import Footer from './Footer';

import { fetchClusters } from '../actions/clusters';
import { init as initAuth } from '../actions/authenticate';
import { init as initURLAndViewSync } from '../classes/urlAndViewSynchronizer';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch } = this.props;
    initAuth(dispatch);
  }

  componentWillReceiveProps(nextProps) {
    const { dispatch, currentView, authentication } = this.props;
    if (!authentication.success && nextProps.authentication.success) {
      this.props.dispatch(fetchClusters());
      initURLAndViewSync(currentView, dispatch);
    }
  }

  render() {
    const main = <h3> Main Content </h3>;
    // FIXME this should not be here
    const showLogin = !this.props.authentication.success;

    return (
      <div>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 pl-0 pr-0">
              <Header />
            </div>
          </div>
          {!showLogin && 
          <div className="row pl-0 pr-0">
            <div className="col-2 pl-1 pr-1 as-leftpane">
              <div>
                <VisibleClusterConnections />
              </div>
            </div>
            <div className="col-10 offset-2 pl-0 pr-0 as-maincontent">
              <MainDashboard />
            </div>
          </div>}
        </div>
        {showLogin &&
         <VisibleAuthenticateModal />}

        <Footer />
      </div>
      );
  }
}

App = connect((state) => {
  return {
    authentication: state.session.authentication,
    currentView: state.currentView,
  };
})(App);

export default App;

