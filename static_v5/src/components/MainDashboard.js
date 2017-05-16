import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';

import NodeDashboard from './NodeDashboard';
import UDFDashboard from './UDFDashboard';
import { VIEW_TYPE } from '../classes/constants';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

class MainDashboard extends React.Component {
  render() {
    const { currentView } = this.props;
    const { entities, viewType } = currentView;
    const { clusterID, nodeHost, namespaceName, setName, udfName } = currentView;

    let dashboard;

    if (viewType === VIEW_TYPE.NODE)
      dashboard = <NodeDashboard clusterID={clusterID} nodeHost={nodeHost} />
    else if (viewType === VIEW_TYPE.UDF)
      dashboard = <UDFDashboard clusterID={clusterID} udfName={udfName} />
    else
      dashboard = viewType;

    return (
      <div>
        {dashboard}
      </div>
      );
  }
}

const main = connect((state) => {
  return {
    currentView: state.currentView
  };
})(MainDashboard);

export default main;


