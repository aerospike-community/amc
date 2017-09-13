import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import VisibleClusterAlerts from 'containers/VisibleClusterAlerts';
import { whenClusterHasCredentials } from 'classes/security';

import Tabs from 'components/Tabs';
import { filterActions } from 'classes/entityActions';
import { CLUSTER_ACTIONS, LOGICAL_CLUSTER_ACTIONS } from 'classes/entityActions';
import { VIEW_TYPE } from 'classes/constants';

// LogicalClusterDashboard handles all the views for the cluster.
// It is also responsible for changing between different views
// of the cluster.
//
// The state of the view, view type is maintained outside of the component.
// Hence there are callbacks to the parent component to change these view states.
class LogicalClusterDashboard extends React.Component {
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
    whenClusterHasCredentials(clusterID, () => {
      const actions = [LOGICAL_CLUSTER_ACTIONS.Overview, 
                       LOGICAL_CLUSTER_ACTIONS.Alerts];

      const views = filterActions(actions, clusterID, VIEW_TYPE.LOGICAL_CLUSTER);
      this.setState({
        views: views
      });
    });
  }

  onViewSelect(view) {
    this.props.onViewSelect(view);
  }

  render() {
    const { clusterID, view }  = this.props;
    const { views } = this.state;

    let dashboard;
    if (view === LOGICAL_CLUSTER_ACTIONS.Overview ) {
      dashboard = <h1> Cluster Overview </h1>

    } else if (view === CLUSTER_ACTIONS.Alerts) {
      dashboard = <VisibleClusterAlerts />

    }

    return (
      <div>
        <Tabs names={views} selected={view} onSelect={this.onViewSelect}/>

        {dashboard}
      </div>
    );
  }
}

LogicalClusterDashboard.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  // the selected cluster
  cluster: PropTypes.object, 
  // the view of the cluster
  view: PropTypes.string,
};

export default LogicalClusterDashboard;


