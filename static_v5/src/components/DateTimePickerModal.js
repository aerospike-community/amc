import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import DateTimePicker from 'react-widgets/lib/DateTimePicker';
import { Button, Form, FormGroup, Label, Col, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import moment from 'moment';

// DateTimePickerModal shows a modal to pick a time range
class DateTimePickerModal extends React.Component {
  constructor(props) {
    super(props);

    // from and to range
    const from = this.props.from || moment().subtract(30, 'minutes');
    const to = this.props.to || moment(from).add(30, 'minutes');

    this.from = from.toDate();
    this.to = to.toDate();

    this.onSelect = this.onSelect.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onSelect() {
    this.props.onSelect(this.from, this.to);
  }

  onCancel() {
    this.props.onCancel();
  }

  render() {
    const title = this.props.title || 'Select Time';
    
    return (
      <Modal isOpen={true} toggle={() => {}}>
        {title &&
        <ModalHeader> {title} </ModalHeader>}
        <ModalBody>
          <Form>
            <FormGroup row>
              <Label sm={2}> From </Label>
              <Col sm={10}>
                <DateTimePicker step={5} max={new Date()} defaultValue={this.from} onChange={(date) => this.from = date}/> 
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label sm={2}> To </Label>
              <Col sm={10}>
                <DateTimePicker step={5} max={new Date()} defaultValue={this.to} onChange={(date) => this.to = date}/> 
              </Col>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.onSelect}>Select</Button>
          <Button color="secondary" onClick={this.onCancel}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

DateTimePickerModal.PropTypes = {
  // callback when the times are selected
  // onSelect(from, to) from, to are Date objects or null
  onSelect: PropTypes.func,
  // callback when the modal is cancelled
  onCancel: PropTypes.func,
  // title of the modal
  title: PropTypes.string
};

export default DateTimePickerModal;

