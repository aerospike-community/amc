import React from 'react';
import { connect } from 'react-redux';

import UDFView from 'components/udf/UDFView';
import { UDF_ACTIONS, UDF_OVERVIEW_ACTIONS }  from 'classes/entityActions';
import { selectUDFOverview } from 'actions/currentView';
import { addUDF, deleteUDF } from 'actions/clusters';
import { isLogicalView } from 'classes/util';
import { VIEW_TYPE } from 'classes/constants';

let IsLogicalView;

const mapStateToProps = (state) => {
  const { clusterID, udfName, view, viewType } = state.currentView;

  IsLogicalView = isLogicalView(viewType);

  return {
    clusterID: clusterID,
    udfName: udfName,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onDeleteSuccess: (clusterID, udfName) => {
      dispatch(deleteUDF(clusterID, udfName));

      const vt = IsLogicalView ? VIEW_TYPE.LOGICAL_UDF_OVERVIEW 
                               : VIEW_TYPE.UDF_OVERVIEW;
      dispatch(selectUDFOverview(clusterID, UDF_OVERVIEW_ACTIONS.Overview, vt));
    }
  };
};

const VisibleUDFView = connect(
  mapStateToProps,
  mapDispatchToProps
)(UDFView);

export default VisibleUDFView;


