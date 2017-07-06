import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import classNames from 'classnames';

import SaveClusterConnection from 'components/cluster/SaveClusterConnection';
import { updateConnection as updateConnectionAPI } from 'api/clusterConnections';

// EditClusterConnectionModal shows a modal to edit a cluster connection
class EditClusterConnectionModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inProgress: false,
      saveErrorMsg: '',
      saveSuccessful: null,
    };

    this.onUpdateConnection = this.onUpdateConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onUpdateConnection(connection) {
    // sending data
    this.setState({
      inProgress: true,
      saveErrorMsg: '',
    });

    // send
    const { clusterID } = this.props;
    updateConnectionAPI(clusterID, connection)
    .then((response) => {
      const { clusterID, onUpdateConnectionSuccess } = this.props;
      this.setState({
        inProgress: false,
        saveSuccessful: true
      });
      window.setTimeout(() => onUpdateConnectionSuccess(clusterID, connection), 2000);
    })
    .catch((message) => {
      this.setState({
        inProgress: false,
        saveErrorMsg: message || 'Failed to update'
      });
    });
  }

  onCancel() {
    this.props.onCancel();
  }

  render() {
    const { clusterName, seeds } = this.props;
    const { inProgress, saveErrorMsg, saveSuccessful } = this.state;

    if (!inProgress && saveSuccessful === true) {
      return (
        <Modal isOpen={true} toggle={() => {}}>
          <ModalHeader> Success </ModalHeader>
          <ModalBody> Successfully updated connection </ModalBody>
        </Modal>
      );
    }


    return (
      <Modal size="lg" isOpen={true} toggle={() => {}}>
        <ModalHeader>Edit Cluster Connection</ModalHeader>
        <ModalBody>
        <SaveClusterConnection clusterName={clusterName} seeds={seeds} inProgress={inProgress}
          onSaveErrorMessage={saveErrorMsg} 
          onSaveConnection={this.onUpdateConnection} onCancel={this.onCancel} />
        </ModalBody>  
      </Modal>
      );
  }
}

EditClusterConnectionModal.PropTypes = {
  clusterID: PropTypes.string,
  clusterName: PropTypes.string,
  // seeds of cluster
  seeds: PropTypes.array,
  // callback when the connection is successfully updated
  // onUpdateConnectionSuccess(clusterID, connection)
  onUpdateConnectionSuccess: PropTypes.func,
  // callback to cancel the modal
  // onCancel()
  onCancel: PropTypes.func,
};

export default EditClusterConnectionModal;

