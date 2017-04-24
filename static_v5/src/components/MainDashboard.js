import React from 'react';
import { render } from 'react-dom';

import NodeDashboard from './NodeDashboard';
import { CLUSTER_ENTITY_TYPE } from '../classes/constants';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

class MainDashboard extends React.Component {
  render() {
    let dashboard;
    // TODO dashboard by state
    if (this.props.maindashboard === CLUSTER_ENTITY_TYPE.NODE) {
      dashboard = <NodeDashboard node={this.props.node} view={this.props.view} />
    }

    return (
      <div>
        {dashboard}
      </div>
      );
  }
}

export default MainDashboard;


