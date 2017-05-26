import React from 'react';
import { connect } from 'react-redux';
import NodeDashboard from 'components/NodeDashboard';

class VisibleNodeDashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  onViewSelect(view) {
    this.setState({
      view: view
    });
  }

  render() {
    const {clusterID, nodeID, view} = props.params;
    return (
        <NodeDashboard clusterID={clusterID} nodeID={nodeID} view={view}
          onViewSelect={this.onViewSelect} />
    );
  }
}

export default VisibleNodeDashboard;

