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

  renderViewChanger() {
    let title, value, icon;
    if (this.props.isLogicalView) {
      title = 'To Physical View';
      value = 'toPhysicalView';
      icon = 'fa fa-server';
    } else {
      title = 'To Logical View';
      value = 'toLogicalView';
      icon = 'fa fa-database';
    }

    const style = { marginLeft: 10 };
    return (
      <div className="float-left as-cursor-pointer" style={style}
           title={title} onClick={() => this.onToolClick(value)}> 
        <i className={icon}></i>
      </div>
    );
  }

  render() {
    return (
      <div className="as-toolbar">
        <div className="float-left"> 
          Clusters 
        </div>
        {this.renderViewChanger()}
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
  onToolClick: PropTypes.func.isRequired,
  
  isLogicalView: PropTypes.bool.isRequired,
};

export default ClusterToolbar;

