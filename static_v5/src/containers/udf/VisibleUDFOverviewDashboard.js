import React from 'react';
import { connect } from 'react-redux';

import UDFOverviewDashboard from 'components/udf/UDFOverviewDashboard';
import { UDF_ACTIONS, UDF_OVERVIEW_ACTIONS }  from 'classes/entityActions';
import { selectViewForViewType, selectUDF } from 'actions/currentView';
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
    onViewSelect: (view) => {
      dispatch(selectViewForViewType(view));
    },

    onUDFCreateSuccess: (clusterID, udfName, udfType) => {
      dispatch(addUDF(clusterID, udfName, udfType));

      dispatch(selectUDF(clusterID, udfName, UDF_ACTIONS.View));
    },
  };
};

const VisibleUDFOverviewDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(UDFOverviewDashboard);

export default VisibleUDFOverviewDashboard;


