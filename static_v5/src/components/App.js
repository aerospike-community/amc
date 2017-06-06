import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import VisibleAuthenticateModal from 'containers/VisibleAuthenticateModal';
import VisibleClusterConnections from 'containers/VisibleClusterConnections';
import VisibleMainDashboard from 'containers/VisibleMainDashboard';
import VisibleHeader from 'containers/VisibleHeader';
import Footer from 'components/Footer';
import { nextNumber } from 'classes/util';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.toolbarHeight = 40;

    this.state = {
      leftPaneCols: 3,
      resizing: {
        inProgress: false,
        leftPanelWidth: 0,
        mainPanelCols: 0
      },

      resizerStyle: {
        top: this.toolbarHeight
      }
    };

    this.leftPanelID = 'app_left_pane_' + nextNumber();

    this.onLeftPaneScroll = this.onLeftPaneScroll.bind(this);
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
    const minSize = 200; // minimum size is 200px

    const onMouseUp = (evt) => {
      const endX = evt.clientX;
      const colSize = window.screen.width/12;
      let ncols = Math.ceil((endX)/colSize);

      const cur = this.state.leftPaneCols;
      if (ncols === cur) {
        if (endX > startX)
          ncols = cur + 1;
        else if (endX < startX)
          ncols = cur - 1;
      }

      // between minSize and 11 cols
      const minCols = Math.ceil(minSize/colSize);
      ncols = Math.max(ncols, minCols);
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

  onLeftPaneScroll() {
    const top = this.toolbarHeight; // toolbar height
    const style = {
      top: top
    };

    const elm = document.getElementById(this.leftPanelID);
    if (elm !== null && elm.scrollTop > 0) // scrollTop > 0 implies there is a scroll bar
      style.height = elm.scrollHeight - top;

    this.setState({
      resizerStyle: style
    });
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
        width: resizing.leftPanelWidth,
        overflow: 'hidden',
      };
      mainPanelCSS = `col-xl-${resizing.mainPanelCols}`;
    } else {
      const ncols = this.state.leftPaneCols;
      leftPanelCSS = `col-xl-${ncols} pr-1 as-leftpane`;
      leftPanelStyle = {};
      mainPanelCSS = showLeftPane ? `as-centerpane offset-${ncols} col-xl-${12-ncols}` 
                                      : 'as-centerpane col-xl-12';
    }

    let leftPane = null;
    if (showLeftPane) {
      leftPane = (
        <div id={this.leftPanelID} className={leftPanelCSS} style={leftPanelStyle} onScroll={this.onLeftPaneScroll}>
          <div>
            <VisibleClusterConnections />
          </div>

          <div className="as-right-border-resizer" style={this.state.resizerStyle} onMouseDown={this.onResize}>
          </div>
        </div>
      );
    }

    let bodyStyle = {};
    if (!showLeftPane) {
      bodyStyle = {marginLeft: 10};
    }

    return (
      <div>
        <VisibleHeader />
        <div className="container-fluid as-body" style={bodyStyle}>
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

