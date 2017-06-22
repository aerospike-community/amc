import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Input, Col, Label, Form, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import Spinner from 'components/Spinner';

// EditConfigModal provides a modal to edit the configs
class EditConfigModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      edits: props.config.slice(), // all the edited configs
    };

    this.onEdit = this.onEdit.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
  }

  onCancel() {
    this.props.onCancel();
  }

  onEdit() {
    const { edits } = this.state;
    this.props.onEdit(edits);
  }

  onInputChange(evt) {
    const value = evt.target.value;
    const name = evt.target.name;

    const edits = this.state.edits.slice(); // copy
    const i = edits.findIndex((e) => e.name === name);
    edits[i].value = value;

    this.setState({
      edits: edits
    });
  }

  renderConfig(config) {
    const {inProgress} = this.props;
    let { name, value } = config;
    let type;

    if (value === 'false')
      value = false;
    else if (value === 'true')
      value = true;
    
    switch (typeof(value)) {
      case 'number':
        type = 'number';
        break;

      case 'boolean':
        type = 'checkbox';
        break;

      case 'string':
      default:
        type = 'text';
        break;
    }

    return (
      <FormGroup row key={name}>
        <Label sm={3}> {name} </Label>
        <Col sm={9}>
          <Input type={type} disabled={inProgress} onChange={this.onInputChange} name={name} value={value} />
        </Col>
      </FormGroup>
    );
  }
  render() {
    const { edits } = this.state;
    const { inProgress, errorMessage } = this.props;
    return (
      <Modal isOpen={true} toggle={() => { }}>
        <ModalHeader>Edit Configs</ModalHeader>
        <ModalBody>
          <Form >
            {edits.map((e) => this.renderConfig(e))}
          </Form>
        </ModalBody>
        <ModalFooter>
          {inProgress &&
           <span> <Spinner /> ... </span>}
          {!inProgress && errorMessage &&
            <span> errorMessage </span>}
          <Button disabled={inProgress} color="primary" onClick={this.onEdit}>Edit</Button>
          <Button disabled={inProgress} color="secondary" onClick={this.onCancel}>Cancel</Button>
        </ModalFooter>
      </Modal>
      );
  }
}

EditConfigModal.PropTypes = {
  // whether the edit is in progress
  inProgress: PropTypes.bool,
  // error message on editing the configs if any
  errorMessage: PropTypes.string,
  // callback to edit the configs
  // onEdit(configs)
  onEdit: PropTypes.func.isRequired,
  // callback to cancel the modal
  // onCancel()
  onCancel: PropTypes.func.isRequired,
  // the configuration parameters
  config: function(props, propName, componentName) {
    props.config.forEach((c) => {
      if (typeof(c.name) !== 'string')
        isValid = false;

      const vt = typeof(c.value);
      if (vt === 'undefined' || (vt !== 'string' && vt !== 'number' && vt !== 'boolean'))
        isValid = false;
    });

    if (!isValid) {
      return new Error('Invalid prop `' + propName + '` supplied to' 
          + ' `' + componentName + '`. Validation failed.');
    }
  }
};

export default EditConfigModal;





