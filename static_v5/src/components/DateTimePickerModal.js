import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import DateTimePicker from 'react-widgets/lib/DateTimePicker';
import { Button, Form, FormGroup, Input, Label, Col, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import moment from 'moment';

// DateTimePickerModal shows a modal to pick a time range
class DateTimePickerModal extends React.Component {
  constructor(props) {
    super(props);

    // from and to range
    const { from, to } = this.props;

    this.timeOptions = [{
      label: '--',
      minutes: 0,
    }, {
      label: '1 minute',
      minutes: 1,
    }, {
      label: '5 minutes',
      minutes: 5,
    }, {
      label: '10 minutes',
      minutes: 10,
    }, {
      label: '30 minutes',
      minutes: 30,
    }, {
      label: '1 hour',
      minutes: 60,
    }];
    this.defaultOption = this.timeOptions[0];

    this.state = { 
      from: from ? from : moment().subtract(30, 'minutes').toDate(),
      to: to ? to : moment().toDate(),
      showFromAndTo: true, 
      selectedOption: this.defaultOption,
    };

    this.onSelect = this.onSelect.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onTimeOptionChange = this.onTimeOptionChange.bind(this);
    this.onFromChange = this.onFromChange.bind(this);
    this.onToChange = this.onToChange.bind(this);
  }

  onSelect() {
    const { from, to } = this.state;
    this.props.onSelect(from, to);
  }

  onCancel() {
    this.props.onCancel();
  }

  onTimeOptionChange(evt) {
    const minutes = +evt.target.value;

    if (minutes === 0) {
      this.setState({
        selectedOption: this.defaultOption
      });
      return;
    }

    const to = moment().toDate();
    const time = this.timeOptions.find((o) => o.minutes === minutes);
    const from = moment().subtract(time.minutes, 'minutes').toDate();

    this.setState({
      selectedOption: time.minutes,
      from: from,
      to: to
    });

    this.updateFromAndTo();
  }

  onFromChange(from) {
    this.setState({
      from: from,
      selectedOption: this.defaultOption,
    });
  }

  onToChange(to) {
    this.setState({
      to: to,
      selectedOption: this.defaultOption,
    });
  }

  // HACK redisplay a new DateTimePicker 
  // to update the to and from
  updateFromAndTo() {
    this.setState({
      showFromAndTo: false,
    });

    window.setTimeout(() => {
      this.setState({
        showFromAndTo: true
      });
    }, 100);
  }

  render() {
    const title = this.props.title || 'Select Time';
    const { from, to, selectedOption, showFromAndTo } = this.state;
    
    return (
      <Modal isOpen={true} toggle={() => {}}>
        {title &&
        <ModalHeader> {title} </ModalHeader>}
        <ModalBody>
          <Form>
            <FormGroup row>
              <Label sm={2}> Last </Label>
              <Col sm={10}>
                <Input type="select" name="last" value={selectedOption.minutes} onChange={this.onTimeOptionChange}>
                  {this.timeOptions.map((o) =>
                    <option key={o.label} value={o.minutes}> {o.label} </option>
                  )}
                </Input>
              </Col>
            </FormGroup>

            <FormGroup row>
              <Label sm={2}> From </Label>
              <Col sm={10}>
                {showFromAndTo && 
                <DateTimePicker step={5} max={new Date()} defaultValue={from} onChange={this.onFromChange}/>}
              </Col>
            </FormGroup>

            <FormGroup row>
              <Label sm={2}> To </Label>
              <Col sm={10}>
                {showFromAndTo && 
                <DateTimePicker step={5} max={new Date()} defaultValue={to} onChange={this.onToChange}/> }
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
  title: PropTypes.string,
  // [from, to] time window
  // Date objects
  from: PropTypes.object,
  to: PropTypes.object,
};

export default DateTimePickerModal;

