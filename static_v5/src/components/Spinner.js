import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

// Spinner shows a spinner.
class Spinner extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const size = this.props.size || 2;
    const classes = `fa fa-spinner fa-spin fa-${size}x fa-fw`;
    return (
      <i className={classes}></i>
    );
  }
}

Spinner.PropTypes = {
  // size in terms of 1, 2, ...
  // where 1 is smallest
  size: PropTypes.number
};

export default Spinner;

