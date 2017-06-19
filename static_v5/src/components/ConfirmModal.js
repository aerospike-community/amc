import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import Spinner from 'components/Spinner';

// ConfirmModal shows a confirmation modal
class ConfirmModal extends React.Component {
  constructor(props) {
    super(props);

    this.onConfirm = this.onConfirm.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onConfirm() {
    this.props.onConfirm();
  }

  onCancel() {
    this.props.onCancel();
  }

  render() {
    const {title, message, inProgress, errorMessage} = this.props;

    return (
      <Modal isOpen={true} toggle={() => {}}>
        <ModalHeader> {title} </ModalHeader>
        <ModalBody>  {message}  </ModalBody>
        <ModalFooter>
          {!inProgress && errorMessage && 
            errorMessage}
          {inProgress &&
           <span> <Spinner /> ... </span>}
          <Button disabled={inProgress} color="primary" onClick={this.onConfirm}>Confirm</Button>
          <Button disabled={inProgress} color="secondary" onClick={this.onCancel}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

ConfirmModal.PropTypes = {
  // title of the modal
  title: PropTypes.string.isRequired,
  // message of the modal
  message: PropTypes.string.isRequired,

  // action on user confirmation is in progress
  inProgress: PropTypes.bool,
  // action on user confirmation has failed with the message
  errorMessage: PropTypes.string,

  // callback called on confirmation
  // onConfirm()
  onConfirm: PropTypes.func.isRequired,
  // callback called on cancellation
  // onCancel()
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmModal;


