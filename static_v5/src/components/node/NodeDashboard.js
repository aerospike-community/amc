import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from 'components/Tabs';
import NodeThroughput from 'components/node/NodeThroughput';
import NodeLatency from 'components/node/NodeLatency';
import NodesSummary from 'components/node/NodesSummary';

import moment from 'moment';
import { getLatency } from 'api/node';

class NodeDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.views = ['Machine', 'Storage', 'Performance'];
  }

  componentDidMount() {
    const {clusterID, nodeHost, onViewSelect} = this.props;
    getLatency(clusterID, nodeHost, moment().subtract(10, 'minutes').unix(), moment().unix());
  }

  render() {
    const {clusterID, nodeHost, onViewSelect} = this.props;
    const view = this.props.view || 'Machine';
    return (
      <div>
        <Tabs names={this.views} selected={view} onSelect={onViewSelect}/>
        <div>
          <NodesSummary clusterID={clusterID} nodeHosts={[nodeHost]} />
          <NodeThroughput clusterID={clusterID} nodeHost={nodeHost} />
          <NodeLatency clusterID={clusterID} nodeHost={nodeHost} />
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
