import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ClusterOverview from './ClusterOverview';
import EditClusterConnection from './EditClusterConnection';
import { CLUSTER_ACTIONS } from '../../classes/constants';

// ClusterDashboard handles all the views for the cluster.
// It is also responsible for changing between different views
// of the cluster.
//
// The state of the view, view type is maintained outside of the component.
// Hence there are callbacks to the parent component to change these view states.
class ClusterDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.onViewClusterOverview.bind(this);
  }

  onViewClusterOverview() {
    const { clusterID } = this.props;
    this.props.onViewClusterOverview(clusterID);
  }

  render() {
    const { clusterID, view }  = this.props;
    const { name, seeds } = this.props.cluster;

    let dashboard;
    if (view === CLUSTER_ACTIONS.Overview) {
      dashboard = <ClusterOverview clusterID={clusterID} />;
    } else if (view === CLUSTER_ACTIONS.Edit) {
      dashboard = <EditClusterConnection clusterName={name} seeds={seeds} clusterID={clusterID}
                      onUpdateConnection={this.props.onUpdateClusterConnection}
                      onCancel={this.onViewClusterOverview} />
    }
    return (
      <div>
        {dashboard}
      </div>
    );
  }
}

ClusterDashboard.PropTypes = {
  clusterID: PropTypes.string.required,
  // the selected cluster
  cluster: PropTypes.object, 
  // the view of the cluster
  view: PropTypes.string,

  // callback to view cluster overview
  // onViewClusterOverview(clusterID)
  onViewClusterOverview: PropTypes.func, 
  // callback to edit cluster connection
  // onUpdateClusterConnection(clusterID, connection)
  onUpdateClusterConnection: PropTypes.func,
};

export default ClusterDashboard;

