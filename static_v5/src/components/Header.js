import React from 'react';
import { render } from 'react-dom';
import '../styles/common.css';
import aerospikelogo from '../images/aerospike-logo.png';

class Header extends React.Component {
  render() {
    return (
      <div className={'as-header'}>
        <img src={aerospikelogo} />
      </div>
      );
  }
}

export default Header;
