import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Input, Col, Label, Form, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import Spinner from 'components/Spinner';

// EditConfigModal provides a modal to edit the configs
class EditConfigModal extends React.Component {
  constructor(props) {
    super(props);

    this.origConfig = props.config.map((c) => Object.assign({}, c));
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
    let { value, name } = evt.target;

    if (this.getType(name) === 'number') {
      // remove spurious non number character
      const c = value.slice(-1);
      if (c < '0' || c > '9')
        value = value.slice(0, -1);

      value = parseInt(value, 10);
    }

    const edits = this.state.edits.slice(); // copy
    const i = edits.findIndex((e) => e.name === name);
    edits[i].value = value;

    this.setState({
      edits: edits
    });
  }

  getType(configName) {
    const config = this.origConfig.find((c) => c.name === configName);
    const { value } = config;

    if (value === 'false' || value === 'true') 
      return 'boolean';
    
    return typeof(value);
  }

  renderConfig(config) {
    const {inProgress} = this.props;
    let { name, value } = config;
    let input;

    const type = this.getType(name);
    if (type === 'boolean') {
      input = <Input type="select" disabled={inProgress} name={name} value={value} onChange={this.onInputChange}>
                <option value="true"> True </option>
                <option value="false"> False </option>
              </Input>;
    } else {
      const t = type === 'number' ? 'number' : 'text';
      input = <Input type={t} disabled={inProgress} onChange={this.onInputChange} name={name} value={value} />;
    }

    return (
      <FormGroup row key={name}>
        <Label sm={5}> {name} </Label>
        <Col sm={7}>
          {input}
        </Col>
      </FormGroup>
    );
  }
  render() {
    const { edits } = this.state;
    const { inProgress, errorMessage } = this.props;
    return (
      <Modal isOpen={true} toggle={() => {}} size="lg">
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
          <Button disabled={inProgress} color="primary" onClick={this.onEdit}>Update</Button>
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





