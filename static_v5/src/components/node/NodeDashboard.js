import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import AQL from 'components/AQL';
import Tabs from 'components/Tabs';
import NodeThroughput from 'components/node/NodeThroughput';
import NodeLatency from 'components/node/NodeLatency';
import NodesSummary from 'components/node/NodesSummary';
import NodeConfigEditor from 'components/node/NodeConfigEditor';
import JobTable from 'components/node/JobTable';
import { NODE_ACTIONS, filterActions } from 'classes/entityActions';
import { VIEW_TYPE } from 'classes/constants';
import { whenClusterHasCredentials } from 'classes/security';

// NodeDashboard diplays all views of a node
class NodeDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      views: []
    };

    this.onViewSelect = this.onViewSelect.bind(this);
  }

  componentDidMount() {
    const { clusterID } = this.props;
    this.setViews(clusterID);
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID } = nextProps;
    if (this.props.clusterID !== clusterID)
      this.setViews(clusterID);
  }

  setViews(clusterID) {
    this.setState({
      views: []
    });

    whenClusterHasCredentials(clusterID, () => {
      const actions = [NODE_ACTIONS.View, NODE_ACTIONS.Latency, 
                       NODE_ACTIONS.Configuration, NODE_ACTIONS.Jobs,
                       NODE_ACTIONS.Query];

      const views = filterActions(actions, clusterID, VIEW_TYPE.NODE);
      this.setState({
        views: views
      });
    });
  }

  onViewSelect(view) {
    this.props.onViewSelect(view);
  }

  render() {
    const {clusterID, nodeHost, onViewSelect} = this.props;
    const view = this.props.view || NODE_ACTIONS.View;
    const { views } = this.state;

    return (
      <div>
        <Tabs names={views} selected={view} onSelect={this.onViewSelect}/>


        {view === NODE_ACTIONS.View && 
        <div>
          <NodesSummary clusterID={clusterID} nodeHosts={[nodeHost]} initiallyExpandAll={true}/>
          <NodeThroughput clusterID={clusterID} nodeHost={nodeHost} />
        </div>
        }

        {view === NODE_ACTIONS.Configuration &&
        <NodeConfigEditor clusterID={clusterID} nodeHost={nodeHost} />
        }

        {view === NODE_ACTIONS.Latency &&
        <NodeLatency clusterID={clusterID} nodeHost={nodeHost} />
        }

        {view === NODE_ACTIONS.Jobs &&
        <JobTable clusterID={clusterID} nodeHost={nodeHost} />
        }

        {view === NODE_ACTIONS.Query &&
        <AQL clusterID={clusterID} nodeHost={nodeHost} />
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
