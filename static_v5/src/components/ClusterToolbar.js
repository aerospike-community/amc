import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'

import 'bootstrap/dist/css/bootstrap.css';

class ClusterToolbar extends React.Component {
  constructor(props) {
    super(props);
  }

  onItemClick(item) {
    let fn = this.props.onItemClick;
    let type = typeof fn;
    if (type === 'function')
      fn(item);
    else
      console.warn(`ClusterToolbar - onItemClick is not a function, is of type ${type}`);
  }

  render() {
    return (
      <div onClick={() => this.onItemClick('addCluster')}> + </div>
      );
  }
}

ClusterToolbar.PropTypes = {
  // callback on clicking an item
  // onItemClick('itemName')
  onItemClick: PropTypes.func.required
};

export default ClusterToolbar;

