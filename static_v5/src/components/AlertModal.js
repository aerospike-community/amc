import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

// AlertModal diplays an alert message
class AlertModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { header, message, type, onOK, onCancel } = this.props;
    const showCancel = typeof(onCancel) === 'function';
    const showOK = typeof(onOK) === 'function';
    const showFooter = showOK || showCancel;

    const headerCSS = classNames('alert', {
      'alert-info': type === 'info',
      'alert-danger': type === 'error',
      'alert-warning': type === 'warn',
      'alert-success': type === 'success',
    });

    return (
      <Modal isOpen={true} toggle={() => {}}>
        <ModalHeader className={headerCSS}> {header} </ModalHeader>
        <ModalBody> {message} </ModalBody>
        {showFooter &&
        <ModalFooter>
          {showOK && 
          <Button color="primary" onClick={onOK}>OK</Button>
          }

          {showCancel &&
          <Button color="secondary" onClick={onCancel}>Cancel</Button>
          }
        </ModalFooter>
        }
        
      </Modal>
    );
  }
}

AlertModal.PropTypes = {
  header: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  
  // (optional) type of message
  // 'error', 'warn', 'success', 'info'
  type: PropTypes.string,

  // (optional) callback on user clicking on ok
  // onOK()
  onOK: PropTypes.func,
  // (optional) callback on user clicking on cancel
  // onCancel()
  onCancel: PropTypes.func,
};


export default AlertModal;

