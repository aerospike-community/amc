import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Nav, NavItem, NavLink } from 'reactstrap';

class Tabs extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {names, selected} = this.props;
    return (
      <div>
        <Nav tabs>
          {names.map((name) => {
            return (
                <NavItem> 
                  <NavLink href="#"> {name} </NavLink> 
                </NavItem>
            );
          })}
        </Nav>
      </div>
      );
  }
}

Tabs.PropTypes = {
  names: PropTypes.arrayOf(PropTypes.string),
  selected: PropTypes.string
};

export default Tabs;

