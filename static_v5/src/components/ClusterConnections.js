import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import VisibleEntityTree from '../containers/VisibleEntityTree';
import VisibleClusterToolbar from '../containers/VisibleClusterToolbar';
import VisibleAddClusterModal from '../containers/VisibleAddClusterModal';

class ClusterConnections extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <VisibleClusterToolbar />
        <VisibleEntityTree />
        {this.props.displayAddCluster &&
         <VisibleAddClusterModal />}
      </div>
      );
  }
}

ClusterConnections.PropTypes = {
  // true whenin the process of adding a new connection
  displayAddConnection: PropTypes.bool,
  // callback when a toolbar item is clicked
  // onToolItemClick('item')
  onToolItemClick: PropTypes.func,
};

export default ClusterConnections;


