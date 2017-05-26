import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import VisibleAuthenticateModal from 'containers/VisibleAuthenticateModal';
import VisibleClusterConnections from 'containers/VisibleClusterConnections';
import VisibleMainDashboard from 'containers/VisibleMainDashboard';
import VisibleHeader from 'containers/VisibleHeader';
import Footer from 'components/Footer';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.onShowLeftPane = this.onShowLeftPane.bind(this);
  }

  onShowLeftPane() {
    this.props.onShowLeftPane();
  }

  componentDidMount() {
    this.props.initAuth();
  }

  componentWillReceiveProps(nextProps) {
    const { currentView, authentication } = this.props;
    if (!authentication.success && nextProps.authentication.success) {
      this.props.initURLAndViewSync(currentView);
    }
  }

  render() {
    // FIXME should this be here
    const loggedIn = this.props.authentication.success;
    const { showLeftPane } = this.props.currentView;
    let leftPane = null;

    if (showLeftPane) {
      leftPane = (
        <div className="col-2 pr-1 as-leftpane">
          <div>
            <VisibleClusterConnections />
          </div>
        </div>
      );
    }
    return (
      <div>
        <VisibleHeader />
        <div className="container-fluid as-body">
          {loggedIn && 
          <div className="row">
            {leftPane}
            <div className={classNames('as-centerpane', {
                              'col-10': showLeftPane,
                              'offset-2': showLeftPane,
                              'col-12': !showLeftPane,
                            })}>
              <VisibleMainDashboard />
            </div>

            {!showLeftPane &&
              <div className="as-leftpane-expand" title="Expand" onClick={this.onShowLeftPane}>
                <i className="fa fa-angle-double-right"> </i>
              </div>
            }
          </div>}
        </div>
        {!loggedIn &&
         <VisibleAuthenticateModal />}

        <Footer />
      </div>
      );
  }
}

App.PropTypes = {
  // authentication state
  authentication: PropTypes.object,
  // current view state
  currentView: PropTypes.object,
  // initialize auth module
  // initAuth()
  initAuth: PropTypes.func,
  // initialize the url module
  // initURLAndViewSync(currentView)
  initURLAndViewSync: PropTypes.func
};

export default App;

