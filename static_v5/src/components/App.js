import React from 'react';
import { render } from 'react-dom';

import VisibleEntityTree from '../containers/VisibleEntityTree';
import VisibleMainDashboard from '../containers/VisibleMainDashboard';
import VisibleClusterConnections from '../containers/VisibleClusterConnections';
import Header from './Header';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

class App extends React.Component {
  render() {
    const leftPane = <VisibleEntityTree />;
    const main = <h3> Main Content </h3>;

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <Header />
          </div>
        </div>
        <div className="row no-gutters">
          <div className="col-2 as-leftpane">
            <VisibleClusterConnections />
          </div>
          <div className="col-10 as-maincontent">
            <VisibleMainDashboard />
          </div>
        </div>
      </div>
      );
  }
}

export default App;

