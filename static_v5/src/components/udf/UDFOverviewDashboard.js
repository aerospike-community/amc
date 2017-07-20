import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from 'components/Tabs';
import UDFCreate from 'components/udf/UDFCreate';
import UDFOverview from 'components/udf/UDFOverview';
import { UDF_OVERVIEW_ACTIONS } from 'classes/entityActions';

class UDFOverviewDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.views = [UDF_OVERVIEW_ACTIONS.Overview, UDF_OVERVIEW_ACTIONS.Create];

    this.onViewSelect = this.onViewSelect.bind(this);
    this.onCreateSuccess = this.onCreateSuccess.bind(this);
  }

  onViewSelect(view) {
    this.props.onViewSelect(view);
  }

  onCreateSuccess(udfName, source, type) {
    const { clusterID } = this.props;
    this.props.onUDFCreateSuccess(clusterID, udfName, type);
  }

  render() {
    const { clusterID, view } = this.props;

    return (
      <div>
        <Tabs names={this.views} selected={view} onSelect={this.onViewSelect}/>

        {view === UDF_OVERVIEW_ACTIONS.Overview &&
        <UDFOverview clusterID={clusterID} />
        }

        {view === UDF_OVERVIEW_ACTIONS.Create &&
        <UDFCreate clusterID={clusterID} onCreateSuccess={this.onCreateSuccess}/>
        }
      </div>
    );
  }
}

UDFOverviewDashboard.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  // view 
  view: PropTypes.string.isRequired,

  // callback to select a view
  // onViewSelect(clusterID, view)
  onViewSelect: PropTypes.func,
  // callback when the udf is created successfully
  // onUDFCreateSuccess(clusterID, udfName, udfType)
  onUDFCreateSuccess: PropTypes.func,
};

export default UDFOverviewDashboard;


