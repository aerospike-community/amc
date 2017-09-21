import React from 'react';
import { connect } from 'react-redux';

import UDFOverviewDashboard from 'components/udf/UDFOverviewDashboard';
import { UDF_ACTIONS }  from 'classes/entityActions';
import { selectViewForViewType, selectUDF } from 'actions/currentView';
import { isLogicalView } from 'classes/util';
import { VIEW_TYPE } from 'classes/constants';

let IsLogicalView;

const mapStateToProps = (state) => {
  const { clusterID, view, viewType } = state.currentView;

  IsLogicalView = isLogicalView(viewType);
  
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
      const vt = IsLogicalView ? VIEW_TYPE.LOGICAL_UDF : VIEW_TYPE.UDF;
      dispatch(selectUDF(clusterID, udfName, UDF_ACTIONS.View, vt));
    },
  };
};

const VisibleUDFOverviewDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(UDFOverviewDashboard);

export default VisibleUDFOverviewDashboard;


