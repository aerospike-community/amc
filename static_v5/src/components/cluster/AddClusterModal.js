import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import classNames from 'classnames';

import SaveClusterConnection from './SaveClusterConnection';
import { addConnection as addConnectionAPI } from '../../api/clusterConnections';

// AddClusterModal shows a modal to add a cluster connection
class AddClusterModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inProgress: false,
      onSaveErrorMessage: '',
    };

    this.onAddConnection = this.onAddConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onAddConnection(connection) {
    // sending data
    this.setState({
      inProgress: true,
      onSaveErrorMessage: '',
    });

    // send
    addConnectionAPI(connection)
    .then((response) => {
      // FIXME the response should have the newly added connection
      this.props.onConnectionAddSuccess(connection);
    })
    .catch((response) => {
      this.setState({
        inProgress: false,
        onSaveErrorMessage: response
      });
    });
  }

  onCancel() {
    this.props.onCancel();
  }

  render() {
    return (
      <Modal size="lg" isOpen={true} toggle={() => {
                                       }}>
        <ModalHeader>Add Cluster Connection</ModalHeader>
        <ModalBody>
          <SaveClusterConnection clusterName={''} seeds={[]} inProgress={this.props.inProgress}
            onSaveErrorMessage={this.state.onSaveErrorMessage}
            onSaveConnection={this.onAddConnection} onCancel={this.onCancel} />
        </ModalBody>  
      </Modal>
      );
  }
}

AddClusterModal.PropTypes = {
  // callback to add a connection
  // onConnectionAddSuccess(connection)
  onConnectionAddSuccess: PropTypes.func,
  // callback to cancel the modal
  // onCancel()
  onCancel: PropTypes.func,
};

export default AddClusterModal;
