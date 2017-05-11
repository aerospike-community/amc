import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from './Tabs';

class NodeDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.views = ['Machine', 'Storage', 'Performance'];
  }

  render() {
    const {clusterID, nodeHost, onViewSelect} = this.props;
    const view = this.props.view || 'Machine';
    return (
      <div>
        <Tabs names={this.views} selected={view} onSelect={onViewSelect}/>
        <div>
          {`Cluster ${clusterID}, Node ${nodeHost}, View ${view}`}
        </div>
      </div>
      );
  }
}

NodeDashboard.PropTypes = {
  clusterID: PropTypes.string,
  nodeHost: PropTypes.string,
  view: PropTypes.string,
  // callback for when a view for the node dashboard is selected
  // onViewSelect('view')
  onViewSelect: PropTypes.func,
};

export default NodeDashboard;
