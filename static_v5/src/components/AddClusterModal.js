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
    const connection = { label: 'Connection ', children: []};
    this.props.onAddConnection(connection);
  }

  onCancel() {
    this.props.onCancel();
  }

  render() {
    const inProgress = this.props.inProgress;
    return (
      <Modal isOpen={true} toggle={() => {
                             }}>
        <ModalHeader>Add Cluster Connection</ModalHeader>
        <ModalBody>
          Add a new cluster connection
        </ModalBody>
        <ModalFooter>
          {inProgress &&
           <span> Creating ... </span>
          }
          <Button disabled={inProgress} color="primary" onClick={this.onAddConnection}>Add</Button>
          <Button disabled={inProgress} color="secondary" onClick={this.onCancel}>Cancel</Button>
        </ModalFooter>
      </Modal>
      );
  }
}

AddClusterModal.PropTypes = {
  // adding a connection is in progress
  inProgress: PropTypes.bool,
  // callback to add a connection
  // callback(properties) TODO add properties
  onAddConnection: PropTypes.func,
  // callback to cancel the modal
  onCancel: PropTypes.func,
};

export default AddClusterModal;



