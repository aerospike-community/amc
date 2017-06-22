import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Nav, NavItem, NavLink } from 'reactstrap';

class Tabs extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: props.default
    };

    this.onSelect= this.onSelect.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.default !== this.props.default) {
      this.setState({
        selected: nextProps.default
      });
    }
  }

  onSelect(name) {
    this.setState({
      selected: name
    });

    this.props.onSelect(name);
  }

  render() {
    const {names} = this.props;
    let {selected} = this.state;
    if (!selected) {
      selected = this.props.default;
    }

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
                <NavItem onClick={() => this.onSelect(name)} key={name}> 
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
  // names of the tabs
  names: PropTypes.arrayOf(PropTypes.string),
  // the default selected tab
  default: PropTypes.string,
  // calbback when the view is selected
  // onSelect(name)
  onSelect: PropTypes.func,
};

export default Tabs;

