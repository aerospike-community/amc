import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ClusterOverview from 'components/cluster/ClusterOverview';
import EditClusterConnection from 'components/cluster/EditClusterConnection';
import { CLUSTER_ACTIONS } from 'classes/entityActions';
import VisibleDeleteConnectionModal from 'containers/VisibleDeleteConnectionModal';

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
    const { clusterID, view, onUpdateConnectionSuccess }  = this.props;
    const { name, seeds } = this.props.cluster;
    const isDelete = view === CLUSTER_ACTIONS.Delete;

    let dashboard;
    if (view === CLUSTER_ACTIONS.Overview || isDelete) {
      dashboard = <ClusterOverview clusterID={clusterID} />;
    } else if (view === CLUSTER_ACTIONS.Edit) {
      dashboard = <EditClusterConnection clusterName={name} seeds={seeds} clusterID={clusterID}
                      onUpdateConnectionSuccess={onUpdateConnectionSuccess}
                      onCancel={() => this.onViewClusterOverview()} />
    }
    return (
      <div>
        {dashboard}
        {isDelete &&
          <VisibleDeleteConnectionModal />
        }
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

  // callback to view cluster overview
  // onViewClusterOverview(clusterID)
  onViewClusterOverview: PropTypes.func, 
  // callback when the connection is successfully updated
  // onUpdateConnectionSuccess(clusterID, connection)
  onUpdateConnectionSuccess: PropTypes.func,
};

export default ClusterDashboard;

