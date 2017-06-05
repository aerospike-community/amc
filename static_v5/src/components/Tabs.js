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
            let nav;
            if (name === selected)
              nav = <NavLink active> {name} </NavLink>;
            else
              nav = <NavLink > {name} </NavLink>;

            return (
                <NavItem> 
                  {nav}
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

