import React from 'react';
import { connect } from 'react-redux';

import UDFDashboard from 'components/udf/UDFDashboard';
import { toUDFPath, toUDFOverviewPath } from 'classes/entityTree';
import { UDF_ACTIONS, UDF_OVERVIEW_ACTIONS }  from 'classes/entityActions';
import { selectPath } from 'actions/currentView';
import { addUDF, deleteUDF } from 'actions/clusters';

const mapStateToProps = (state) => {
  const { clusterID, udfName, view } = state.currentView;
  return {
    clusterID: clusterID,
    udfName: udfName,
    view: view
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onViewSelect: (clusterID, udfName, view) => {
      const path = toUDFPath(clusterID, udfName);
      dispatch(selectPath(path, view));
    },

    onUDFCreated: (clusterID, udfName, udfType) => {
      dispatch(addUDF(clusterID, udfName, udfType));

      const path = toUDFPath(clusterID, udfName);
      dispatch(selectPath(path, UDF_ACTIONS.View));
    },

    onDeleteSuccess: (clusterID, udfName) => {
      dispatch(deleteUDF(clusterID, udfName));

      const path = toUDFOverviewPath(clusterID);
      dispatch(selectPath(path, UDF_OVERVIEW_ACTIONS.View));
    }
  };
};

const VisibleUDFDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(UDFDashboard);

export default VisibleUDFDashboard;

