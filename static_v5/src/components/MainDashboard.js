import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';

import NodeDashboard from './NodeDashboard';
import { VIEW_TYPE } from '../classes/constants';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

class MainDashboard extends React.Component {
  render() {
    const { currentView } = this.props;
    let dashboard;
    // TODO dashboard by state
    if (currentView === VIEW_TYPE.NODE) {
      dashboard = <NodeDashboard clusterID={currentView.clusterID} nodeHost={currentView.nodeHost}/>
    }

    return (
      <div>
        {currentView.viewType} {currentView.selectedEntityPath} {currentView.view}
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


