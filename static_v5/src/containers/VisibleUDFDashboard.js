import React from 'react';
import { connect } from 'react-redux';

import UDFDashboard from 'components/udf/UDFDashboard';
import { toUDFPath, toUDFOverviewPath } from 'classes/entityTree';
import { VIEW_TYPE }  from 'classes/constants';
import { UDF_ACTIONS, UDF_OVERVIEW_ACTIONS }  from 'classes/entityActions';
import { selectPath } from 'actions/currentView';
import { addUDF } from 'actions/clusters';

const mapStateToProps = (state) => {
  const { clusterID, udfName, viewType, view } = state.currentView;
  return {
    clusterID: clusterID,
    udfName: udfName,
    viewType: viewType,
    view: view
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onEditUDF: (clusterID, udfName) => {
      const path = toUDFPath(clusterID, udfName);
      dispatch(selectPath(path, UDF_ACTIONS.Edit));
    },

    onViewUDF: (clusterID, udfName) => {
      const path = toUDFPath(clusterID, udfName);
      dispatch(selectPath(path, UDF_ACTIONS.View));
    },

    onCreateUDF: (clusterID, udfName, udfType) => {
      dispatch(addUDF(clusterID, udfName, udfType));

      const path = toUDFPath(clusterID, udfName);
      dispatch(selectPath(path, UDF_ACTIONS.View));
    },

    onViewUDFOverview: (clusterID) => {
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

