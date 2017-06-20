import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'

import { Button } from 'reactstrap';

class ClusterToolbar extends React.Component {
  constructor(props) {
    super(props);
  }

  onToolClick(item) {
    this.props.onToolClick(item);
  }

  render() {
    return (
      <div className="as-toolbar">
        <div className="float-left"> 
          Clusters 
        </div>
        <div className="float-right" title="Hide" onClick={() => this.onToolClick('hideEntityTree')}>
          <i className="fa fa-angle-double-left"></i>
        </div>
        <div className="float-right" onClick={() => this.onToolClick('addCluster')}> 
          <Button color="link" className="as-cursor-pointer"> Add </Button>
        </div>
        <div className="clearfix"></div>
      </div>
      );
  }
}

ClusterToolbar.PropTypes = {
  // callback on clicking a tool on the toolbar
  // onToolClick('toolName')
  onToolClick: PropTypes.func.isRequired
};

export default ClusterToolbar;

