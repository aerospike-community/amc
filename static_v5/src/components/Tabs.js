import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import 'bootstrap/dist/css/bootstrap.css';

class Tabs extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {names, selected} = this.props;
    return (
      <div>
        <nav className="navbar navbar-toggleable-md navbar-light" style={{ background: 'lavender' }}>
          <div className="navbar-collapse">
            <ul className="navbar-nav">
              {names.map((name) => {
                <li className="nav-item"> 
                  <a className={classNames('nav-link', {active: name === selected})}>  
                    {name}
                  </a> 
                </li>
              })}
            </ul>
          </div>
        </nav>
      </div>
      );
  }
}

Tabs.PropTypes = {
  names: PropTypes.arrayOf(PropTypes.string),
  selected: PropTypes.string
};

export default Tabs;

