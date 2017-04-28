import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'

import 'bootstrap/dist/css/bootstrap.css';

class ClusterToolbar extends React.Component {
  constructor(props) {
    super(props);
  }

  onItemClick(item) {
    this.props.onItemClick(item);
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

