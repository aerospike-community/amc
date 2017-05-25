import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import UDFView from './UDFView';
import UDFEdit from './UDFEdit';
import UDFCreate from './UDFCreate';
import { VIEW_TYPE, UDF_ACTIONS, UDF_OVERVIEW_ACTIONS }  from '../../classes/constants';

// UDFDashboard handles all the views for the udf.
// It is also responsible for changing between different views
// of the udf.
//
// The state of the view, view type is maintained outside of the component.
// Hence there are callbacks to the parent component to change these view states.
class UDFDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.onEditUDF = this.onEditUDF.bind(this);
    this.onViewUDF = this.onViewUDF.bind(this);
    this.onCreateUDF = this.onCreateUDF.bind(this);
    this.onViewUDFOverview = this.onViewUDFOverview.bind(this);
    this.onNewUDF = this.onNewUDF.bind(this);
  }

  isUDF() {
    return this.props.viewType === VIEW_TYPE.UDF;
  }

  isUDFView() {
    return this.isUDF() && this.props.view === UDF_ACTIONS.View;
  }

  isUDFEdit() {
    return this.isUDF() && this.props.view === UDF_ACTIONS.Edit;
  }

  isUDFOverview() {
    return this.props.viewType === VIEW_TYPE.UDF_OVERVIEW;
  }

  isUDFCreate() {
    return this.isUDFOverview() && this.props.view === UDF_OVERVIEW_ACTIONS.Create;
  }

  onEditUDF() {
    const {clusterID, udfName} = this.props;
    this.props.onEditUDF(clusterID, udfName);
  }

  onViewUDF() {
    const {clusterID, udfName} = this.props;
    this.props.onViewUDF(clusterID, udfName);
  }

  onCreateUDF() {
    const {clusterID} = this.props;
    this.props.onCreateUDF(clusterID);
  }

  onViewUDFOverview() {
    const {clusterID} = this.props;
    this.props.onViewUDFOverview(clusterID);
  }

  onNewUDF(udfName, udfSource, udfType) {
    const {clusterID} = this.props;
    this.props.onCreateUDF(clusterID, udfName, udfType);
  }

  render() {
    let view;
    if (this.isUDFView())
      view = <UDFView clusterID={this.props.clusterID} udfName={this.props.udfName} onEditUDF={this.onEditUDF} />;
    else if (this.isUDFEdit())
      view = <UDFEdit clusterID={this.props.clusterID} udfName={this.props.udfName} onViewUDF={this.onViewUDF} />;
    else if (this.isUDFCreate())
      view = <UDFCreate clusterID={this.props.clusterID} onCancel={this.onViewUDFOverview} onNewUDF={this.onNewUDF}/>;
    else if (this.isUDFOverview())
      view = 'UDF Overview';

    return (
      <div>
        <h2> UDF </h2>
        {view}
      </div>
    );
  }
}

UDFDashboard.PropTypes = {
  clusterID: PropTypes.string,
  udfName: PropTypes.string,
  // view type of the udf
  viewType: PropTypes.string,
  // view of interest in the viewType
  view: PropTypes.string,

  // edit a UDF
  // onEditUDF(clusterID, udfName)
  onEditUDF: PropTypes.func,
  // view a UDF
  // onViewUDF(clusterID, udfName)
  onViewUDF: PropTypes.func,
  // create a UDF
  // onCreateUDF(clusterID, udfName, udfSource, udfType)
  onCreateUDF: PropTypes.func,
  // view the UDF overview
  // onViewUDFOverview(clusterID)
  onViewUDFOverview: PropTypes.func,
};

export default UDFDashboard;
