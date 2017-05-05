import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';

import VisibleAuthenticateModal from '../containers/VisibleAuthenticateModal';
import VisibleEntityTree from '../containers/VisibleEntityTree';
import VisibleMainDashboard from '../containers/VisibleMainDashboard';
import VisibleClusterConnections from '../containers/VisibleClusterConnections';
import Header from './Header';

import { fetchClusters } from '../actions/clusters';
import { init as initAuth } from '../actions/authenticate';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    initAuth(this.props.dispatch);
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.authentication.success && nextProps.authentication.success)
      this.props.dispatch(fetchClusters());
  }

  render() {
    const leftPane = <VisibleEntityTree />;
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
          <div className="row pl-0 pr-0">
            <div className="col-2 as-leftpane">
              <VisibleClusterConnections />
            </div>
            <div className="col-10 pl-0 pr-0 as-maincontent">
              <VisibleMainDashboard />
            </div>
          </div>
        </div>
        {showLogin &&
         <VisibleAuthenticateModal />}
        <footer className="as-footer">
          <div className="container-fluid">
            Footer
          </div>
        </footer>
      </div>
      );
  }
}

App = connect(function(state) {
  return {
    authentication: state.session.authentication
  };
})(App);

export default App;

