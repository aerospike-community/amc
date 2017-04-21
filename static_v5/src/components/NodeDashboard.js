import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

class NodeDashboard extends React.Component {
  render() {
    const view = this.props.view || 'Default';
    return (
      <div>
        <ul className="nav nav-pills">
          <li className="nav-item">
            <a className="nav-link active" href="#">Active</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">Link</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">Link</a>
          </li>
          <li className="nav-item">
            <a className="nav-link disabled" href="#">Disabled</a>
          </li>
        </ul>
        {view}
        {this.props.node.label}
      </div>
      );
  }
}

NodeDashboard.PropTypes = {
  view: PropTypes.string,
  node: PropTypes.object
};

export default NodeDashboard;
