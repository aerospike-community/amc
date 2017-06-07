import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Button } from 'reactstrap';

import ThroughputChart from 'charts/ThroughputChart';
import { nextNumber } from 'classes/util';
import { getThroughput } from 'api/clusterConnections';
import DateTimePickerModal from 'components/DateTimePickerModal';

const types = {
  read_tps: 'Read',
  write_tps: 'Write',

  batch_read_tps: 'Batch',
  query_tps: 'Query',
  scan_tps: 'Scan',
  udf_tps: 'UDF',
};

// ThroughputCharts displays the throughput charts for all types
// in the given data
class ThroughputCharts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showDateTimePicker: false
    };

    this.throughput = {}; // map of 'chart type' to the throughput statistics
    this.charts = {}; // map of 'chart type' to chart instance

    this.onShowDateTimePicker = this.onShowDateTimePicker.bind(this);
    this.onHideDateTimePicker = this.onHideDateTimePicker.bind(this);
    this.onSelectDateTime = this.onSelectDateTime.bind(this);
  }

  // process all the throughput
  setThroughput(throughput) {
    let data = {};
    for (const k in types) {
      const v = types[k];
      const tp = this.processThroughput(throughput[k]);
      data[v] = {
        name: v,
        throughput: tp
      };
    }
    this.throughput = data;
  }

  // process the throughput for a single type
  processThroughput(throughput) {
    let data = [];
    for (const nodeHost in throughput) {
      data.push({
        key: nodeHost,
        values: throughput[nodeHost]
      });
    }
    return data;
  }
  
  // get the id for the chart type
  id(type) {
    return 'cluster_performance_' + type;
  }

  // set up the charts
  // throughput needs to be setup before calling setupCharts
  setupCharts() {
    for (const type in this.throughput) {
      const {name, throughput} = this.throughput[type];
      const id = '#' + this.id(type);
      const chart = new ThroughputChart(id, throughput, name);
      chart.draw();

      this.charts[type] = chart;
    }
  }

  // draw the charts
  // the charts need to be setup before calling drawCharts
  drawCharts() {
    for (const type in this.throughput) {
      const {throughput} = this.throughput[type];
      const chart = this.charts[type];
      chart.update(throughput);
    }
  }

  // update the charts
  updateCharts(throughput) {
    this.setThroughput(throughput);
    this.drawCharts();
  }

  componentDidMount() {
    const { clusterID } = this.props;
    const from = moment().subtract(30, 'minutes').unix();
    const to = moment().unix();

    this.props.getThroughput(from, to)
      .then((response) => {
        this.setThroughput(response.throughput);
        this.setupCharts();
      })
      .catch((message) => console.error(message));
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

    const { clusterID } = this.props;
    this.props.getThroughput(from.unix(), to.unix())
      .then((response) => {
        this.updateCharts(response.throughput);
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
    const { showDateTimePicker } = this.state;
    const { disableTimeWindowSelection } = this.props;
    const title = this.props.title || 'Throughput';

    return (
      <div>
        {showDateTimePicker &&
        <DateTimePickerModal title="Select Time Window" 
            onCancel={this.onHideDateTimePicker} onSelect={this.onSelectDateTime}/>}

        <div className="row">
          <div className="col-xl-12 as-section-header">
            {title}
            {!disableTimeWindowSelection && 
            <div className="float-right">
              <Button color="link" onClick={this.onShowDateTimePicker}> Interval </Button>
            </div>}
          </div>
        </div>
        <div className="row">
          <svg style={bigStyle} id={this.id(types.read_tps)} className="col-xl-6"> </svg>
          <svg style={bigStyle} id={this.id(types.write_tps)} className="col-xl-6"> </svg>
        </div>
        <div className="row">
          <svg style={smStyle} id={this.id(types.query_tps)} className="col-xl-3"> </svg>
          <svg style={smStyle} id={this.id(types.batch_read_tps)} className="col-xl-3"> </svg>
          <svg style={smStyle} id={this.id(types.scan_tps)} className="col-xl-3"> </svg>
          <svg style={smStyle} id={this.id(types.udf_tps)} className="col-xl-3"> </svg>
        </div>
      </div>
    );
  }
}

ThroughputCharts.PropTypes = {
  // function to fetch throughput
  //
  // getThroughput returns a promise with the response
  // from, to are in unix seconds
  getThroughput: PropTypes.func,
  // title of the throughputs
  title: PropTypes.string,
  // whether to allow selection of time window
  disableTimeWindowSelection: PropTypes.bool,
};

export default ThroughputCharts;

