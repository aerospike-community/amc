import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Input } from 'reactstrap';

import { formatTimeWindow } from 'classes/util';
import DateTimePickerModal from 'components/DateTimePickerModal';

// ChartsLayout lays out the charts as specified in the
// layout props
class ChartsLayout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showDateTimePicker: false,
      // [from, to] time window for which
      // the throughputs are shown
      from: moment().subtract(10, 'minutes'),
      to: moment(),

      // the last x minutes
      // zero signifies not selected
      lastXMinutes: 10, 

      option: this.props.defaultOption,
    };

    this.onOptionSelect = this.onOptionSelect.bind(this);
    this.onShowDateTimePicker = this.onShowDateTimePicker.bind(this);
    this.onHideDateTimePicker = this.onHideDateTimePicker.bind(this);
    this.onSelectDateTime = this.onSelectDateTime.bind(this);
  }

  onOptionSelect(evt) {
    const option = evt.target.value;
    if (option === this.state.option)
      return;

    this.props.onOptionSelect(option);
    this.setState({
      option: option
    });
  }

  // on date time selected
  onSelectDateTime(from, to, lastXMinutes) {
    this.setState({
      showDateTimePicker: false,
      lastXMinutes: lastXMinutes
    });

    if (!from && !to)
      console.error('From, to are both null');

    if (!from) {
      to = moment(to);
      from = moment(to).subtract(30, 'minutes');
    } else if (!to) {
      from = moment(from);
      to = moment(from).add(30, 'minutes');
    } else {
      from = moment(from);
      to = moment(to);
      if (to.isBefore(from))
        to = moment(from).add(30, 'minutes');
    }

    // set window
    this.setState({
      from: from,
      to: to
    });

    const inSync = lastXMinutes !== 0;
    this.props.onUpdateTimeWindow(from, to, inSync);
  }

  onShowDateTimePicker() {
    this.setState({
      showDateTimePicker: true
    });
  }

  onHideDateTimePicker() {
    this.setState({
      showDateTimePicker: false
    });
  }

  renderCharts() {
    let rows = [];

    this.props.layout.forEach((row, i) => {
      const { charts, height } = row;

      const ncols = Math.floor(12/charts.length); // bootstrap columns
      const className = `col-xl-${ncols}`;

      const all = [];
      charts.forEach((chart) => {
        const { name, id } = chart;

        all.push(
          <div className={className} key={name}>
            <div className="row as-chart-title"> {name} </div>
            <div className="row">
              <svg style={{height: height}} id={id}> </svg>
            </div>
          </div>
        );
      });

      rows.push(
        <div className="row" key={i}>
          {all}
        </div>
      );
    });

    return rows;
  }

  render() {
    const { option, showDateTimePicker, from, to, lastXMinutes } = this.state;
    const { title, options } = this.props;

    const timeWindow = lastXMinutes === 0 
                        ? formatTimeWindow(from, to) 
                        : 'Last ' + lastXMinutes + (lastXMinutes > 1 ? ' minutes' : ' minute');


    return (
      <div>
        {showDateTimePicker &&
        <DateTimePickerModal title="Select Time Window" from={from.toDate()} to={to.toDate()} lastXMinutes={lastXMinutes}
            onCancel={this.onHideDateTimePicker} onSelect={this.onSelectDateTime}/>}

        <div className="row">
          <div className="col-xl-12 as-section-header">
            {title}

            <div className="float-right as-chart-timewindow" onClick={this.onShowDateTimePicker}>
              {timeWindow}
            </div>

            {options.length > 1 &&
            <div>
              <Input type="select" name="last" size="sm" value={option} onChange={this.onOptionSelect}>
                {options.map((o) =>
                  <option key={o} value={o}> {o} </option>
                )}
              </Input>
            </div>
            }
          </div>
        </div>

        {this.renderCharts()}
      </div>
    );
  }
}

ChartsLayout.PropTypes = {
  // title of the charts
  title: PropTypes.string, 
  // layout of the charts
  // Ex: [{
  //  charts: [{
  //    name: 'Read', 
  //    id: 'read'
  //  }, 
  //  ...], 
  //  height: 200,
  //  header: '', (optional)
  // }, ...]
  layout: PropTypes.object.isRequired,

  // (optional) callback when the time window has been updated
  // if ommitted cannot select time window 
  //
  // from, to - window of time to show the charts for
  // keepInSync - whether the chart should be kept in sync with the current time
  // onUpdateTimeWindow(from, to, keepInSync)
  onUpdateTimeWindow: PropTypes.func,

  // callback when the options have been changed
  onOptionSelect: PropTypes.func,
  // the options to display
  options: PropTypes.arrayOf(PropTypes.string),
  // the default optiona
  defaultOption: PropTypes.string,
};

export default ChartsLayout;


