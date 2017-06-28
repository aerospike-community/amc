import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Button } from 'reactstrap';

import ThroughputChart from 'charts/ThroughputChart';
import { nextNumber, formatTimeWindow } from 'classes/util';
import DateTimePickerModal from 'components/DateTimePickerModal';

const Types = {
  read_tps: 'Reads per second',
  write_tps: 'Writes per second',

  batch_read_tps: 'Batch',
  query_tps: 'Query',
  scan_tps: 'Scan',
  udf_tps: 'UDF',
};

// default config for chart placements
const ChartPlacements = [{
  types: ['read_tps', 'write_tps'],
  height: 350,
}, {
  height: 200,
  types: ['batch_read_tps', 'query_tps', 'scan_tps', 'udf_tps']
}];


// ThroughputCharts displays the throughput charts for all types
// in the given data
class ThroughputCharts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showDateTimePicker: false,
      // [from, to] time window for which
      // the throughputs are shown
      from: moment().subtract(10, 'minutes'),
      to: moment(),
    };

    this.chartPlacements = props.chartPlacements || ChartPlacements;
    this.sequenceNumber = nextNumber();

    // polling values
    this.intervalID = null; // poller id
    if (!this.props.doNotSyncWithCurrentTime) {
      this.keepInSync();
    }

    this.throughput = {}; // throughput data returned by the server
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

  // convert throghput to a format consumable by the charts
  chartThroughput(throughput) {
    let data = {};
    for (const k in Types) {
      const tp = typeThroughput(throughput[k]);
      data[k] = {
        name: Types[k],
        throughput: tp
      };
    }
    return data;

    // process the throughput for a single type
    function typeThroughput(throughput) {
      let data = [];
      for (const nodeHost in throughput) {
        data.push({
          key: nodeHost,
          values: throughput[nodeHost],
        });
      }

      // HACK 
      // FIXME the API has to make sure that the values
      // returned are of the same length
      let shortestLen = Number.MAX_VALUE;
      data.forEach((d) => {
        shortestLen = Math.min(shortestLen, d.values.length);
      });

      data.forEach((d) => {
        d.values = d.values.slice(0, shortestLen);
      });
      return data;
    }
  }

  // get the id for the chart type
  id(type) {
    return 'throughput_chart_' + this.sequenceNumber + '_' + type.replace(/ /g, '');
  }

  // set up the charts
  setupCharts() {
    const chartTP = this.chartThroughput(this.throughput);
    for (const type in chartTP) {
      const {name, throughput} = chartTP[type];
      const id = '#' + this.id(Types[type]);
      const chart = new ThroughputChart(id, throughput, name);
      chart.draw();

      this.charts[type] = chart;
    }
  }

  // draw the charts
  // the charts need to be setup before calling drawCharts
  drawCharts() {
    const chartTP = this.chartThroughput(this.throughput);
    for (const type in chartTP) {
      const {throughput} = chartTP[type];
      const chart = this.charts[type];
      chart.update(throughput);
    }
  }

  componentWillUnmount() {
    if (this.intervalID !== null) 
      window.clearInterval(this.intervalID);
  }

  componentDidMount() {
    const { clusterID } = this.props;
    const { from, to } = this.state;

    this.props.getThroughput(from.unix(), to.unix())
      .then((response) => {
        this.throughput = response.throughput;
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

      this.props.getThroughput(to.unix())
        .then((response) => {
          if (!to.isSame(this.state.to)) // updated in the interim
            return;

          // append values
          const tp = response.throughput;
          let toTimestamp = null;
          let fromTimestamp = null; 
          for (const type in tp) {
            for (const nodeHost in tp[type]) {
              const val = tp[type][nodeHost];
              if (val.length === 0)
                continue;

              // append values
              const orig = this.throughput[type][nodeHost];
              const last = orig.length === 0 ? null : orig[orig.length-1].timestamp;
              val.forEach((v) => {
                if (last === null || v.timestamp > last)
                  orig.push(v);
              });

              // remove earlier data
              orig.splice(0, val.length);

              // latest time
              const time = val[val.length-1].timestamp; 
              if (toTimestamp === null || time > toTimestamp)
                toTimestamp = time;

              // earliest time
              if (orig.length > 0)
                fromTimestamp = orig[0].timestamp;
            }
          }

          this.drawCharts();

          // update timestamp
          if (fromTimestamp === null && toTimestamp === null) {
            return;
          } else if (fromTimestamp === null) {
            this.setState({
              to: moment(toTimestamp)
            });
          } else if (toTimestamp === null) {
            this.setState({
              from: moment(fromTimestamp)
            });
          } else {
            this.setState({
              from: moment(fromTimestamp),
              to: moment(toTimestamp)
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
    this.props.getThroughput(from.unix(), to.unix())
      .then((response) => {
        this.throughput = response.throughput;
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

  renderCharts() {
    let rows = [];

    this.chartPlacements.forEach((row, i) => {
      let charts = [];
      const { types, height } = row;

      const ncols = Math.floor(12/types.length); // bootstrap columns
      const className = `col-xl-${ncols}`;

      types.forEach((type) => {
        const name = Types[type];
        const id = this.id(name);

        charts.push(
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
          {charts}
        </div>
      );
    });

    return rows;
  }

  render() {
    const { showDateTimePicker, from, to } = this.state;
    const { disableTimeWindowSelection } = this.props;
    const title = this.props.title || 'Throughput';

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

        {this.renderCharts()}
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
  // set this value if you do not want the chart
  // to keep itself in sync with the current time
  doNotSyncWithCurrentTime: PropTypes.bool,
  // configuration for the chart placements
  // only charts defined here will be rendered
  // see ChartPlacements
  chartPlacements: PropTypes.object,
};

export default ThroughputCharts;

