import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import VisibleLogicalClusterDashboard from 'containers/cluster/VisibleLogicalClusterDashboard';
import VisibleClusterDashboard from 'containers/cluster/VisibleClusterDashboard';
import VisibleViewClusterConnectionModal from 'containers/cluster/VisibleViewClusterConnectionModal';
import VisibleEditClusterConnectionModal from 'containers/cluster/VisibleEditClusterConnectionModal';
import VisibleUDFView from 'containers/udf/VisibleUDFView';
import VisibleUDFOverviewDashboard from 'containers/udf/VisibleUDFOverviewDashboard'
import VisibleSetsOverview from 'containers/set/VisibleSetsOverview';
import VisibleSetView from 'containers/set/VisibleSetView';
import VisibleIndexView from 'containers/index/VisibleIndexView';
import VisibleIndexesOverviewDashboard from 'containers/index/VisibleIndexesOverviewDashboard';

import Welcome from 'components/Welcome';
import NodeDashboard from 'components/node/NodeDashboard';
import NamespaceDashboard from 'components/namespace/NamespaceDashboard';
import MainDashboardBreadcrumbs from 'components/MainDashboardBreadcrumbs';
import LogicalNamespaceDashboard from 'components/logical-namespace/LogicalNamespaceDashboard';

import { VIEW_TYPE } from 'classes/constants';
import { CLUSTER_ACTIONS } from 'classes/entityActions';

class MainDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeView = this.onChangeView.bind(this);
  }

  onChangeView(toView) {
    const { view } = this.props.currentView;
    if (toView === view)
      return;

    this.props.onChangeView(toView);
  }

  render() {
    const { currentView, isClusterConnected, clusterName } = this.props;
    const { entities, viewType, view } = currentView;
    const { clusterID, nodeHost, namespaceName, setName, udfName } = currentView;

    let dashboard;

    if (clusterID && !isClusterConnected) {
      if (viewType === VIEW_TYPE.CLUSTER && view === CLUSTER_ACTIONS.Edit)
        dashboard = <VisibleClusterDashboard />
      else
        dashboard = <h4 style={{marginTop: 20}}> Please connect to {`"${clusterName}"`} </h4>;

    } else if (viewType === VIEW_TYPE.NODE) {
      dashboard = <NodeDashboard clusterID={clusterID} nodeHost={nodeHost} view={view} onViewSelect={this.onChangeView}/>

    } else if (viewType === VIEW_TYPE.NAMESPACE) {
      dashboard = <NamespaceDashboard clusterID={clusterID} nodeHost={nodeHost} namespaceName={namespaceName}
                    view={view} onViewSelect={this.onChangeView}/>

    } else if (viewType === VIEW_TYPE.SET) {
      dashboard = <VisibleSetView />

    } else if (viewType === VIEW_TYPE.SET_OVERVIEW) {
      dashboard = <VisibleSetsOverview />

    } else if (viewType === VIEW_TYPE.INDEXES_OVERVIEW || 
               viewType === VIEW_TYPE.LOGICAL_INDEXES_OVERVIEW) {
      dashboard = <VisibleIndexesOverviewDashboard />
        
    } else if (viewType === VIEW_TYPE.INDEX || 
               viewType === VIEW_TYPE.LOGICAL_INDEX) {
      dashboard = <VisibleIndexView />
        
    } else if (viewType === VIEW_TYPE.UDF || 
               viewType === VIEW_TYPE.LOGICAL_UDF) {
      dashboard = <VisibleUDFView />

    } else if (viewType === VIEW_TYPE.UDF_OVERVIEW ||
               viewType === VIEW_TYPE.LOGICAL_UDF_OVERVIEW) {
      dashboard = <VisibleUDFOverviewDashboard />

    } else if (viewType === VIEW_TYPE.CLUSTER) {
      dashboard = <VisibleClusterDashboard />

    } else if (viewType === VIEW_TYPE.START_VIEW || 
               viewType === VIEW_TYPE.LOGICAL_START_VIEW) {
      dashboard = <Welcome />;

    } else if (viewType === VIEW_TYPE.LOGICAL_NAMESPACE) {
      dashboard = <LogicalNamespaceDashboard 
                    clusterID={clusterID} namespaceName={namespaceName} 
                    view={view} onViewSelect={this.onChangeView} />;

    } else if (viewType === VIEW_TYPE.LOGICAL_CLUSTER) {
      dashboard = <VisibleLogicalClusterDashboard />

    } else {
      let h = view ? view : '';
      if (viewType)
        h += ' ' + viewType;
      dashboard = <div className="as-centerpane-header"> {h} </div>;

    }

    const { displayEditConnection, displayViewConnection } = this.props;
    return (
      <div>
        <MainDashboardBreadcrumbs clusterName={clusterName} currentView={currentView} />
        {dashboard}

        {displayViewConnection &&
        <VisibleViewClusterConnectionModal />
        }

        {displayEditConnection &&
        <VisibleEditClusterConnectionModal />
        }
      </div>
      );
  }
}

MainDashboard.PropTypes = {
  // current view state
  currentView: PropTypes.object,
  // change the view on the selected view type
  // onChangeView(view)
  onChangeView: PropTypes.func,
  // if a cluster entity is selected 
  // is the cluster connected
  isClusterConnected: PropTypes.bool,
  // name of the cluster the dashboard is in
  clusterName: PropTypes.bool,
  // display a connection
  displayViewConnection: PropTypes.bool,
  // display edit of a connection
  displayEditConnection: PropTypes.bool,
};

export default MainDashboard;
