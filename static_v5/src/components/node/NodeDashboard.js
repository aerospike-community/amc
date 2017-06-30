import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from 'components/Tabs';
import NodeThroughput from 'components/node/NodeThroughput';
import NodeLatency from 'components/node/NodeLatency';
import NodesSummary from 'components/node/NodesSummary';
import NodeConfigEditor from 'components/node/NodeConfigEditor';
import { NODE_ACTIONS } from 'classes/entityActions';

// NodeDashboard diplays all views of a node
class NodeDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.views = [NODE_ACTIONS.View, NODE_ACTIONS.Latency, NODE_ACTIONS.Configuration];
    this.onViewSelect = this.onViewSelect.bind(this);
  }

  onViewSelect(view) {
    this.props.onViewSelect(view);
  }

  render() {
    const {clusterID, nodeHost, onViewSelect} = this.props;
    const view = this.props.view || NODE_ACTIONS.View;

    return (
      <div>
        <Tabs names={this.views} selected={view} onSelect={this.onViewSelect}/>


        {view === NODE_ACTIONS.View && 
        <div>
          <NodesSummary clusterID={clusterID} nodeHosts={[nodeHost]} />
          <NodeThroughput clusterID={clusterID} nodeHost={nodeHost} />
        </div>
        }

        {view === NODE_ACTIONS.Configuration &&
        <NodeConfigEditor clusterID={clusterID} nodeHost={nodeHost} />
        }

        {view === NODE_ACTIONS.Latency &&
        <NodeLatency clusterID={clusterID} nodeHost={nodeHost} />
        }
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
