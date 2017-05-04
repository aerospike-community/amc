import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class AuthenticateModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: '',
      password: ''
    };

    this.onInputChange = this.onInputChange.bind(this);
    this.onAuthenticate = this.onAuthenticate.bind(this);
  }

  onAuthenticate() {
    const credentials = {
      user: this.state.user,
      password: this.state.password
    };
    this.props.onAuthenticate(credentials);
  }

  onInputChange(evt) {
    const value = evt.target.value;
    const name = evt.target.name;

    this.setState({
      [name]: value
    });
  }

  render() {
    const inProgress = this.props.inProgress;
    return (
      <Modal isOpen={true} toggle={() => {
                             }}>
        <ModalHeader>Log In</ModalHeader>
        <ModalBody>
          <form>
            <div className="form-group">
              <label> User </label>
              <input type="text" className="form-control" disabled={inProgress} onChange={this.onInputChange} name="user" value={this.state.user} />
            </div>
            <div className="form-group">
              <label> Password </label>
              <input type="password" className="form-control" disabled={inProgress} onChange={this.onInputChange} name="password" value={this.state.password} />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          {inProgress &&
           <span> Creating ... </span>}
          <Button disabled={inProgress} color="primary" onClick={this.onAuthenticate}>Submit</Button>
        </ModalFooter>
      </Modal>
      );
  }
}

AuthenticateModal.PropTypes = {
  // authentication is in progress
  inProgress: PropTypes.bool,
  // message on failure
  failureMessage: PropTypes.string,
  // callback to authenticate
  // onAuthenticate(credentials) 
  onAuthenticate: PropTypes.func,
};

export default AuthenticateModal;




