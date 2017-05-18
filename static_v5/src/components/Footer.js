import React from 'react';
import { render } from 'react-dom';
import { system } from '../api/amc';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

class Footer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      version: ''
    };
  }

  componentDidMount() {
    system()
      .then((response) => {
        this.setState({
          version: response.version
        });
      });
  }

  render() {
    return (
      <div>
        <footer className="as-footer">
          <div className="container-fluid">
            AMC {this.state.version}
          </div>
        </footer>
      </div>
      );
  }
}

export default Footer;


