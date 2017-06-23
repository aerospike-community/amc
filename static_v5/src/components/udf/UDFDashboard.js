import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from 'components/Tabs';
import UDFView from 'components/udf/UDFView';
import UDFEdit from 'components/udf/UDFEdit';
import UDFCreate from 'components/udf/UDFCreate';
import { VIEW_TYPE }  from 'classes/constants';
import { UDF_ACTIONS, UDF_OVERVIEW_ACTIONS }  from 'classes/entityActions';

// UDFDashboard handles all the views for the udf.
// It is also responsible for changing between different views
// of the udf.
//
// The state of the view, view type is maintained outside of the component.
// Hence there are callbacks to the parent component to change these view states.
class UDFDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.views = [UDF_ACTIONS.View, UDF_ACTIONS.Edit, UDF_ACTIONS.Delete];

    this.onViewSelect = this.onViewSelect.bind(this);
    this.onDeleteSuccess = this.onDeleteSuccess.bind(this);
  }

  onDeleteSuccess() {
    const { clusterID, udfName } = this.props;
    this.props.onDeleteSuccess(clusterID, udfName);
  }

  onViewSelect(view) {
    const { clusterID, udfName } = this.props;
    this.props.onViewSelect(clusterID, udfName, view);
  }

  render() {
    const { clusterID, udfName, view } = this.props;

    return (
      <div>
        <Tabs names={this.views} selected={this.props.view} onSelect={this.onViewSelect}/>

        {view === UDF_ACTIONS.View &&
        <UDFView clusterID={clusterID} udfName={udfName} />
        }

        {view === UDF_ACTIONS.Delete &&
        <UDFView clusterID={clusterID} udfName={udfName} view="delete" onDeleteSuccess={this.onDeleteSuccess}/>
        }

        {view === UDF_ACTIONS.Edit &&
        <UDFEdit clusterID={clusterID} udfName={udfName} onViewUDF={() => this.onViewSelect(UDF_ACTIONS.View)}/>
        }
      </div>
    );
  }
}

UDFDashboard.PropTypes = {
  clusterID: PropTypes.string,
  udfName: PropTypes.string,
  // view of interest 
  view: PropTypes.string,

  // callback for when a view for the udf dashboard is selected
  // onViewSelect(clusterID, udfName, 'view')
  onViewSelect: PropTypes.func,

  // callback on udf delete success
  // onDeleteSuccess(clusterID, udfName)
  onDeleteSuccess: PropTypes.func,
};

export default UDFDashboard;
