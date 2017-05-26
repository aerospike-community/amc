import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';

import aerospikelogo from 'images/aerospike-logo.png';

class Header extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { onLogout, userName } = this.props;
    return (
      <div className={'as-header'}>
        <div className="float-left as-logo">
          <img src={aerospikelogo} />
        </div>
        <div className="float-right">
          { userName }
          <Button color="link" onClick={onLogout}> Log out </Button>
        </div>
      </div>
      );
  }
}

Header.PropTypes = {
  userName: PropTypes.string,
  // log out the user
  // onLogout()
  onLogout: PropTypes.func,
};

export default Header;
