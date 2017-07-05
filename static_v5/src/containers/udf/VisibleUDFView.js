import React from 'react';
import { connect } from 'react-redux';

import UDFView from 'components/udf/UDFView';
import { toUDFPath, toUDFOverviewPath } from 'classes/entityTree';
import { UDF_ACTIONS, UDF_OVERVIEW_ACTIONS }  from 'classes/entityActions';
import { selectPath } from 'actions/currentView';
import { addUDF, deleteUDF } from 'actions/clusters';

const mapStateToProps = (state) => {
  const { clusterID, udfName, view } = state.currentView;
  return {
    clusterID: clusterID,
    udfName: udfName,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onDeleteSuccess: (clusterID, udfName) => {
      dispatch(deleteUDF(clusterID, udfName));

      const path = toUDFOverviewPath(clusterID);
      dispatch(selectPath(path, UDF_OVERVIEW_ACTIONS.Overview));
    }
  };
};

const VisibleUDFView = connect(
  mapStateToProps,
  mapDispatchToProps
)(UDFView);

export default VisibleUDFView;


