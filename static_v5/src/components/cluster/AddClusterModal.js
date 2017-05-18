import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import classNames from 'classnames';

import UpdateClusterConnection from './UpdateClusterConnection';

class AddClusterModal extends React.Component {
  constructor(props) {
    super(props);

    this.onAddConnection = this.onAddConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onAddConnection(connection) {
    this.props.addConnection(connection);
  }

  onCancel() {
    this.props.cancel();
  }

  render() {
    return (
      <Modal size="lg" isOpen={true} toggle={() => {
                                       }}>
        <ModalHeader>Add Cluster Connection</ModalHeader>
        <ModalBody>
          <UpdateClusterConnection clusterName={''} seeds={[]} inProgress={this.props.inProgress}
            updateConnection={this.onAddConnection} cancel={this.onCancel} />
        </ModalBody>  
      </Modal>
      );
  }
}

AddClusterModal.PropTypes = {
  // adding a connection is in progress
  inProgress: PropTypes.bool,
  // callback to add a connection
  // addConnection(connection)
  addConnection: PropTypes.func,
  // callback to cancel the modal
  // cancel()
  cancel: PropTypes.func,
};

export default AddClusterModal;
