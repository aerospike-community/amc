import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

import { nextNumber } from 'classes/util';

// ClusterSummary provides a summary of the nodes and namespaces in the
// cluster
class ClusterSummary extends React.Component {
  constructor(props) {
    super(props);

    this.id = nextNumber();

    this.state = {
      nodeTooltip: false,
      nsTooltip: false
    };

    this.toggleNodeTooltip = this.toggleNodeTooltip.bind(this);
    this.toggleNSTooltip = this.toggleNSTooltip.bind(this);
  }

  toggleNodeTooltip() {
    this.setState({
      nodeTooltip: !this.state.nodeTooltip
    });
  }

  toggleNSTooltip() {
    this.setState({
      nsTooltip: !this.state.nsTooltip
    });
  }

  render() {
    const co = this.props.clusterOverview;
    const { nodes, namespaces } = co;
    const buildVersion = co.clusterBuilds.latestVersion;
    const id = this.id;
    const nodeID = 'cs_node_' + id;
    const nsID = 'cs_namespace_' + id;
    const { nodeTooltip, nsTooltip } = this.state;

    return (
      <div> 
        <div className="row">
          <div className="col-xl-12 as-text-overflow-ellipsis" id={nodeID} >
            <span className="font-weight-bold"> Nodes: {nodes.length} </span>
            {nodes.join(', ')}
            <Tooltip placement="left bottom" target={nodeID} isOpen={nodeTooltip} toggle={this.toggleNodeTooltip}>
              {nodes.join(', ')}
            </Tooltip>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-12 as-text-overflow-ellipsis" id={nsID} >
            <span className="font-weight-bold"> Namespaces: {namespaces.length} </span>
            {namespaces.join(', ')}
            <Tooltip placement="left bottom" target={nsID} isOpen={nsTooltip} toggle={this.toggleNSTooltip}>
              {namespaces.join(', ')}
            </Tooltip>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-12 as-text-overflow-ellipsis"> 
            <span className="font-weight-bold"> Build: </span>
            {buildVersion}
          </div>
        </div>
      </div>
    );
  }
}

ClusterSummary.PropTypes = {
  // the cluster overview
  clusterOverview: PropTypes.object.isRequired,
};

export default ClusterSummary;
