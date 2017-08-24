import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import VisibleClusterAlerts from 'containers/VisibleClusterAlerts';
import VisibleViewClusterConnectionModal from 'containers/cluster/VisibleViewClusterConnectionModal';
import ClusterOverview from 'components/cluster/ClusterOverview';
import EditClusterConnectionModal from 'components/cluster/EditClusterConnectionModal';
import ClusterLatency from 'components/cluster/ClusterLatency';
import ClusterNodesConfig from 'components/cluster/ClusterNodesConfig';
import ClusterRolesDashboard from 'components/cluster/ClusterRolesDashboard';
import ClusterUsersDashboard from 'components/cluster/ClusterUsersDashboard';
import XDRGraph from 'components/XDRGraph';

import Tabs from 'components/Tabs';
import { CLUSTER_ACTIONS } from 'classes/entityActions';

// ClusterDashboard handles all the views for the cluster.
// It is also responsible for changing between different views
// of the cluster.
//
// The state of the view, view type is maintained outside of the component.
// Hence there are callbacks to the parent component to change these view states.
class ClusterDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.views = [CLUSTER_ACTIONS.Overview, CLUSTER_ACTIONS.Latency, CLUSTER_ACTIONS.XDR,
                  CLUSTER_ACTIONS.Configuration, CLUSTER_ACTIONS.Roles, CLUSTER_ACTIONS.Users, 
                  CLUSTER_ACTIONS.Alerts];

    this.onViewSelect = this.onViewSelect.bind(this);
  }

  onViewSelect(view) {
    this.props.onViewSelect(view);
  }

  render() {
    const { clusterID, view, onSelectNode }  = this.props;
    const { name, seeds } = this.props.cluster;

    let dashboard;
    if (view === CLUSTER_ACTIONS.Overview ) {
      dashboard = <ClusterOverview clusterID={clusterID} onSelectNode={onSelectNode} />;

    } else if (view === CLUSTER_ACTIONS.Latency) {
      dashboard = <ClusterLatency clusterID={clusterID} />

    } else if (view === CLUSTER_ACTIONS.Configuration) {
      dashboard = <ClusterNodesConfig clusterID={clusterID} />
        
    } else if (view === CLUSTER_ACTIONS.Alerts) {
      dashboard = <VisibleClusterAlerts />

    } else if (view === CLUSTER_ACTIONS.Users) {
      dashboard = <ClusterUsersDashboard clusterID={clusterID} />
       
    } else if (view === CLUSTER_ACTIONS.Roles) {
      dashboard = <ClusterRolesDashboard clusterID={clusterID} />

    } else if (view === CLUSTER_ACTIONS.XDR) {
      dashboard = <XDRGraph />
    }

    return (
      <div>
        <Tabs names={this.views} selected={view} onSelect={this.onViewSelect}/>

        {dashboard}
      </div>
    );
  }
}

ClusterDashboard.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  // the selected cluster
  cluster: PropTypes.object, 
  // the view of the cluster
  view: PropTypes.string,

  // callback to select a node
  // onSelectNode(clusterID, nodeHost)
  onSelectNode: PropTypes.func,
};

export default ClusterDashboard;

