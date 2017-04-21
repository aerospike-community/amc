import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class AddClusterModal extends React.Component {
  constructor(props) {
    super(props);

    this.onAddConnection = this.onAddConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onAddConnection() {
    let fn = this.props.onAddConnection;
    let type = typeof fn;
    if (type === 'function')
      fn(); // TODO properties for a new connection
    else
      console.warn(`AddClusterModal - onAddConnection is not a function, is of type ${type}`);
  }

  onCancel() {
    let fn = this.props.onCancel;
    let type = typeof fn;
    if (type === 'function')
      fn();
    else
      console.warn(`AddClusterModal - onCancel is not a function, is of type ${type}`);
  }

  render() {
    return (
      <Modal isOpen={true} toggle={() => {
                             }}>
        <ModalHeader>Add Cluster Connection</ModalHeader>
        <ModalBody>
          Add a new cluster connection
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.onAddConnection}>Add</Button>
          <Button color="secondary" onClick={this.onCancel}>Cancel</Button>
        </ModalFooter>
      </Modal>
      );
  }
}

AddClusterModal.PropTypes = {
  // callback to add a connection
  // callback(properties) TODO add properties
  onAddConnection: PropTypes.func,
  // callback to cancel the modal
  onCancel: PropTypes.func,
};

export default AddClusterModal;



