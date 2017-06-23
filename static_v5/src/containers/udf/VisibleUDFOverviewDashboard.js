import React from 'react';
import { connect } from 'react-redux';

import UDFOverviewDashboard from 'components/udf/UDFOverviewDashboard';
import { toUDFPath, toUDFOverviewPath } from 'classes/entityTree';
import { UDF_ACTIONS, UDF_OVERVIEW_ACTIONS }  from 'classes/entityActions';
import { selectPath } from 'actions/currentView';
import { addUDF } from 'actions/clusters';

const mapStateToProps = (state) => {
  const { clusterID, view } = state.currentView;
  return {
    clusterID: clusterID,
    view: view
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onViewSelect: (clusterID, view) => {
      const path = toUDFOverviewPath(clusterID);
      dispatch(selectPath(path, view));
    },

    onUDFCreateSuccess: (clusterID, udfName, udfType) => {
      dispatch(addUDF(clusterID, udfName, udfType));

      const path = toUDFPath(clusterID, udfName);
      dispatch(selectPath(path, UDF_ACTIONS.View));
    },
  };
};

const VisibleUDFOverviewDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(UDFOverviewDashboard);

export default VisibleUDFOverviewDashboard;


