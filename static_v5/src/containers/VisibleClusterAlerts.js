import React from 'react';
import { connect } from 'react-redux';
import ClusterAlerts from 'components/cluster/ClusterAlerts';

const mapStateToProps = (state) => {
  const { clusterID } = state.currentView;
  const alertObj = state.alerts[clusterID];
  const alerts = alertObj ? alertObj.alerts : [];

  return {
    alerts: alerts,
  };
};

const VisibleClusterAlerts = connect(
  mapStateToProps,
)(ClusterAlerts);

export default VisibleClusterAlerts;



