import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'

import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';

class ClusterToolbar extends React.Component {
  constructor(props) {
    super(props);
  }

  onToolClick(item) {
    this.props.onToolClick(item);
  }

  render() {
    return (
      <div>
        <div className="float-right" onClick={() => this.onToolClick('addCluster')}> 
          <i className="fa fa-plus"></i>
        </div>
        <div className="clearfix"></div>
      </div>
      );
  }
}

ClusterToolbar.PropTypes = {
  // callback on clicking a tool on the toolbar
  // onToolClick('toolName')
  onToolClick: PropTypes.func.required
};

export default ClusterToolbar;

