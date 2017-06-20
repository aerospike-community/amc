import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import classNames from 'classnames';

import { deleteConnection } from 'api/clusterConnections';
import ConfirmModal from 'components/ConfirmModal';

// DeleteConnectionModal shows a modal to delete a cluster connection
class DeleteConnectionModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inProgress: false,
      onSaveErrorMessage: '',
      successful: false,
    };

    this.onDeleteConnection = this.onDeleteConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onDeleteConnection() {
    // sending data
    this.setState({
      inProgress: true,
      onSaveErrorMessage: '',
    });

    // send
    const { connection } = this.props;
    deleteConnection(connection.id)
    .then((response) => {
      this.setState({
        successful: true
      });

      window.setTimeout(() => {
        this.props.onConnectionDeleteSuccess(connection);
      }, 2000);
    })
    .catch((message) => {
      this.setState({
        inProgress: false,
        onSaveErrorMessage: message
      });
    });
  }

  onCancel() {
    this.props.onCancel();
  }

  render() {
    const { inProgress, onSaveErrorMessage, successful } = this.state;
    const { name } = this.props.connection;

    const title = 'Delete connection';
    const message = `Are you sure you want to delete connection - ${name} ?`;

    if (successful) {
      return (
        <Modal isOpen={true} toggle={() => {}}>
          <ModalHeader> Success </ModalHeader>
          <ModalBody> Successfully deleted connection {name} </ModalBody>
        </Modal>
      );
    } else {
      return <ConfirmModal title={title} message={message} inProgress={inProgress} errorMessage={onSaveErrorMessage}
            onConfirm={this.onDeleteConnection} onCancel={this.onCancel} />;
    }
  }
}

DeleteConnectionModal.PropTypes = {
  // callback to delete a connection
  // onConnectionDeleteSuccess(connection)
  onConnectionDeleteSuccess: PropTypes.func,

  // the connection to delete
  connection: PropTypes.object.isRequired,

  // callback to cancel the modal
  // onCancel()
  onCancel: PropTypes.func,
};

export default DeleteConnectionModal;

