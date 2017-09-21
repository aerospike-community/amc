import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'

import { Button, Input } from 'reactstrap';

class ClusterToolbar extends React.Component {
  constructor(props) {
    super(props);
  }

  onToolClick(item) {
    this.props.onToolClick(item);
  }

  renderViewChanger() {
    const { isLogicalView } = this.props;
    const view = isLogicalView ? 'logical' : 'physical'

    const onViewChange = (evt) => {
      const to = evt.target.value;
      if (to === view)
        return;

      const item = to === 'logical' ? 'toLogicalView' : 'toPhysicalView';
      this.onToolClick(item);
    };

    const style = { marginRight: 10 };
    return (
      <div>
        <Input type="select" value={view} onChange={onViewChange}>
          <option key={"logical"} value={"logical"}> Logical View </option>
          <option key={"physical"} value={"physical"}> Node View </option>
        </Input>
      </div>
    );
  }

  render() {
    return (
      <div className="as-toolbar">
        <div className="float-left"> 
          {this.renderViewChanger()}
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
  onToolClick: PropTypes.func.isRequired,
  
  isLogicalView: PropTypes.bool.isRequired,
};

export default ClusterToolbar;

