import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Button } from 'reactstrap';

import LatencyChart from 'charts/LatencyChart';
import { nextNumber, formatTimeWindow, replaceUnicode } from 'classes/util';
import DateTimePickerModal from 'components/DateTimePickerModal';

const Types = {
  reads: 'Reads',
  writes: 'Writes',
  query: 'Query',
  udf: 'UDF',
};

// LatencyCharts displays the latency charts for all types
// in the given data
class LatencyCharts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showDateTimePicker: false,

      // [from, to] time window for which
      // the latency is shown
      from: moment().subtract(10, 'minutes'),
      to: moment(),
    };

    this.sequenceNumber = nextNumber();

    // polling values
    this.intervalID = null; // poller id
    if (!this.props.doNotSyncWithCurrentTime) {
      this.keepInSync();
    }

    this.latency = {}; // latency data returned by the server
    this.charts = {}; // map of 'chart type' to chart instance

    this.onShowDateTimePicker = this.onShowDateTimePicker.bind(this);
    this.onHideDateTimePicker = this.onHideDateTimePicker.bind(this);
    this.onSelectDateTime = this.onSelectDateTime.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;
    if (props.doNotSyncWithCurrentTime === nextProps.doNotSyncWithCurrentTime)
      return;

    if (nextProps.doNotSyncWithCurrentTime)
      window.clearInterval(this.intervalID);
    else 
      this.keepInSync();
  }

  // convert latency to a format consumable by the charts
  chartLatency(latency) {
    let chartLat = {}; 
    let type;

    for (type in Types) {
      chartLat[type] = {
        name: Types[type],
        latency: toTypeLatency(latency, type)
      };
    }

    return chartLat;

    // convert to type latency
    function toTypeLatency(latency, type) {
      const data = {};
      latency.forEach((lat) => {
        const timestamp = lat[type].timestampUnix*1000;

        lat[type].data.forEach((d) => {
          for (let measure in d) {
            if (!data[measure]) {
              data[measure] = [];
            }

            data[measure].push({
              value: d[measure].value,
              timestamp: timestamp,
            });
          }
        });

      });

      // convert to array
      const arr = [];
      for (let measure in data) {
        arr.push({
          key: replaceUnicode(measure),
          values: data[measure]
        });
      }
      return arr;
    }
  }

  // get the id for the chart type
  id(type) {
    return 'latency_chart_' + this.sequenceNumber + '_' + type.replace(/ /g, '');
  }

  // set up the charts
  setupCharts() {
    const chartLat = this.chartLatency(this.latency);
    for (const type in Types) {
      const {name, latency} = chartLat[type];
      const id = '#' + this.id(Types[type]);
      const chart = new LatencyChart(id, latency, name);
      chart.draw();

      this.charts[type] = chart;
    }
  }

  // draw the charts
  // the charts need to be setup before calling drawCharts
  drawCharts() {
    const chartLat = this.chartLatency(this.latency);
    for (const type in Types) {
      const {latency} = chartLat[type];
      const chart = this.charts[type];
      chart.update(latency);
    }
  }

  componentWillUnmount() {
    if (this.intervalID !== null) 
      window.clearInterval(this.intervalID);
  }

  componentDidMount() {
    const { clusterID } = this.props;
    const { from, to } = this.state;

    this.props.getLatency(from.unix(), to.unix())
      .then((latency) => {
        this.latency = latency;
        this.setupCharts();
      })
      .catch((message) => console.error(message));
  }
  
  // keep the data in sync with current time
  keepInSync() {
    if (this.intervalID !== null) 
      window.clearInterval(this.intervalID);
  
    this.intervalID = window.setInterval(() => {
      const to = moment(this.state.to); // copy

      // present 'to' should be close enough to now
      if (moment().subtract(2, 'minutes').isAfter(to)) 
        return;

      this.props.getLatency(to.unix())
        .then((latency) => {
          if (!to.isSame(this.state.to)) // updated in the interim
            return;

          // calculate latest timestamp
          let lastTimestamp = null; 
          latency.forEach((lat) => {
            const k = Object.keys(lat)[0];
            const time = lat[k].timestampUnix*1000;
            if (lastTimestamp === null || time > lastTimestamp)
              lastTimestamp = time;
          });

          this.latency = this.latency.concat(latency);
          this.drawCharts();

          // update timestamp
          if (lastTimestamp !== null) {
            this.setState({
              to: moment(lastTimestamp)
            });
          }
        });
    }, 60*1000); // every minute
  }

  // update chart based on the selected from and to
  onSelectDateTime(from, to) {
    this.setState({
      showDateTimePicker: false
    });

    if (!from && !to)
      return;

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

    // fetch data for window
    const { clusterID } = this.props;
    this.props.getLatency(from.unix(), to.unix())
      .then((latency) => {
        this.latency = latency;
        this.drawCharts();
      })
      .catch((message) => console.error(message));
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

  render() {
    const bigStyle = { 
      height: 350
    };
    const smStyle = {
      height: 200
    };
    const { showDateTimePicker, from, to } = this.state;
    const { disableTimeWindowSelection } = this.props;
    const title = this.props.title || 'Latency';

    const timeWindow = formatTimeWindow(from, to);

    return (
      <div>
        {showDateTimePicker &&
        <DateTimePickerModal title="Select Time Window" from={from.toDate()} to={to.toDate()}
            onCancel={this.onHideDateTimePicker} onSelect={this.onSelectDateTime}/>}

        <div className="row">
          <div className="col-xl-12 as-section-header">
            {title}
            {!disableTimeWindowSelection && 
            <div className="float-right as-chart-timewindow" onClick={this.onShowDateTimePicker}>
              {timeWindow}
            </div>}
          </div>
        </div>
        <div className="row">
          <div className="col-xl-6">
            <div className="row as-chart-title"> {Types.reads} </div>
            <div className="row">
              <svg style={bigStyle} id={this.id(Types.reads)}> </svg>
            </div>
          </div>
          <div className="col-xl-6">
            <div className="row as-chart-title"> {Types.writes} </div>
            <div className="row">
              <svg style={bigStyle} id={this.id(Types.writes)}> </svg>
            </div>
          </div>
        </div>
        <div className="row" style={{marginTop: 10}}>
          <div className="col-xl-6">
            <div className="row as-chart-title"> {Types.query} </div>
            <div className="row">
              <svg style={smStyle} id={this.id(Types.query)}> </svg>
            </div>
          </div>
          <div className="col-xl-6">
            <div className="row as-chart-title"> {Types.udf} </div>
            <div className="row">
              <svg style={smStyle} id={this.id(Types.udf)}> </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

LatencyCharts.PropTypes = {
  // function to fetch latency
  //
  // getLatency returns a promise with the latency.
  // from, to are in unix seconds
  getLatency: PropTypes.func,
  // title of the throughputs
  title: PropTypes.string,
  // whether to allow selection of time window
  disableTimeWindowSelection: PropTypes.bool,
  // set this value if you do not want the chart
  // to keep itself in sync with the current time
  doNotSyncWithCurrentTime: PropTypes.bool,
};

export default LatencyCharts;


