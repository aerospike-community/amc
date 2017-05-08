import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import classNames from 'classnames';

class AuthClusterConnectionModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      password: '',
    };

    this.onInputChange = this.onInputChange.bind(this);
    this.onConnect = this.onConnect.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onConnect() {
    const {name, password} = this.state;
    this.props.authenticate(this.props.clusterID, name, password);
  }

  onCancel() {
    this.props.cancel();
  }

  onInputChange(evt) {
    const value = evt.target.value;
    const name = evt.target.name;

    this.setState({
      [name]: value
    });
  }

  render() {
    const clusterName = this.props.clusterName;
    const {inProgress, hasFailed, failureMessage} = this.props;
    return (
      <Modal isOpen={true} toggle={() => {
                                       }}>
        <ModalHeader>Authenticate {clusterName} </ModalHeader>
        <ModalBody>
          <form>
            <div className="form-group">
              <label> User </label>
              <input type="text" className="form-control" disabled={inProgress} onChange={this.onInputChange} name="name" value={this.state.name} />
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
          {!inProgress && hasFailed &&
           <span className="as-error-text"> {failureMessage} </span>}
          <Button disabled={inProgress} color="primary" onClick={this.onConnect}>Authenticate</Button>
          <Button disabled={inProgress} color="secondary" onClick={this.onCancel}>Cancel</Button>
        </ModalFooter>
      </Modal>
      );
  }
}

AuthClusterConnectionModal.PropTypes = {
  clusterName: PropTypes.string.required,
  clusterID: PropTypes.string.required,
  // adding a connection is in progress
  inProgress: PropTypes.bool,
  // authentication failed
  hasFailed: PropTypes.bool,
  // message on failed authentication
  failureMessage: PropTypes.string,
  // callback to authenticate a connection
  // callback(name, password)
  authenticate: PropTypes.func,
  // callback to cancel the modal
  cancel: PropTypes.func,
};

export default AuthClusterConnectionModal;

