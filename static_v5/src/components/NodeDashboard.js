import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/lua';
import 'brace/theme/github';

import 'bootstrap/dist/css/bootstrap.css';

import { nextNumber } from '../classes/util';

class NodeDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.id = 'lua_editor' + nextNumber();
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-toggleable-md navbar-light" style={{ background: 'lavender' }}>
          <div className="navbar-collapse">
            <ul className="navbar-nav">
              <li className="nav-item"> <a className="nav-link active"> Configuration </a> </li>
              <li className="nav-item"> <a className="nav-link"> Machine </a> </li>
              <li className="nav-item"> <a className="nav-link"> Performance </a> </li>
              <li className="nav-item"> <a className="nav-link"> Storage </a> </li>
            </ul>
          </div>
        </nav>
        <div>
          {this.props.node.name}
          <AceEditor mode="lua" theme="github" name={this.id} />
        </div>
        <div>
          {this.props.view}
        </div>
      </div>
      );
  }
}

NodeDashboard.PropTypes = {
  view: PropTypes.string,
  node: PropTypes.object
};

export default NodeDashboard;
