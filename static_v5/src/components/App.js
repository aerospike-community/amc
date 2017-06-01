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

    this.state = {
      leftPaneCols: 3,
      resizing: {
        inProgress: false,
        leftPanelWidth: 0,
        mainPanelCols: 0
      }
    };

    this.onShowLeftPane = this.onShowLeftPane.bind(this);
    this.onResize = this.onResize.bind(this);
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

  // resize the left panel
  onResize(evt) {
    const startX = evt.clientX;

    const onMouseUp = (evt) => {
      const endX = evt.clientX;
      const colSize = window.screen.width/12;
      let ncols = Math.floor((endX)/colSize);

      const cur = this.state.leftPaneCols;
      if (ncols === cur) {
        if (endX > startX)
          ncols = cur + 1;
        else if (endX < startX)
          ncols = cur - 1;
      }

      // between 3 and 11
      ncols = Math.max(ncols, 3);
      ncols = Math.min(ncols, 11);

      this.setState({
        leftPaneCols: ncols,
        resizing: {
          inProgress: false
        }
      });

      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
    }

    const onMouseMove = (evt) => {
      const curX = evt.clientX;
      const screenWidth = window.screen.width;

      const colSize = screenWidth/12;
      const mainPanelCols = Math.floor((screenWidth - curX)/colSize);

      this.setState({
        resizing: {
          inProgress: true,
          leftPanelWidth: curX,
          mainPanelCols: mainPanelCols - 1, // accounting for gutters between columns
        }
      });
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  render() {
    // FIXME should this be here
    const loggedIn = this.props.authentication.success;
    const { showLeftPane } = this.props.currentView;

    const { resizing } = this.state;
    let leftPanelCSS = ''; 
    let mainPanelCSS = '';
    let leftPanelStyle = {};

    if (resizing.inProgress) {
      leftPanelStyle = {
        width: resizing.leftPanelWidth
      };
      mainPanelCSS = `col-xl-${resizing.mainPanelCols}`;
    } else {
      const ncols = this.state.leftPaneCols;
      leftPanelCSS = `col-xl-${ncols} pr-1 as-leftpane`;
      mainPanelCSS = showLeftPane ? `as-centerpane offset-${ncols} col-xl-${12-ncols}` 
                                      : 'as-centerpane col-xl-12';
    }

    let leftPane = null;
    if (showLeftPane) {
      leftPane = (
        <div className={leftPanelCSS} style={leftPanelStyle}>
          <div>
            <VisibleClusterConnections />
          </div>

          <div className="as-right-border-resizer" onMouseDown={this.onResize}>
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
            <div className={mainPanelCSS}>
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

