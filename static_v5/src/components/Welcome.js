import React from 'react';
import { render } from 'react-dom';

class Welcome extends React.Component {
  render() {
    return (
      <div style={{marginTop: 10}}>
        <h3> Welcome to AMC </h3>
        <p> Select a connection to monitor </p>
      </div>
    );
  }
}

export default Welcome;



