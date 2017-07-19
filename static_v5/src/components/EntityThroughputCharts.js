import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Button } from 'reactstrap';

import ChartsLayout from 'components/ChartsLayout';
import  ThroughputCharts from 'charts/ThroughputCharts';
import { ThroughputGrouping, ThroughputOperations as TPO } from 'charts/constants';
import { nextNumber } from 'classes/util';

// names of the operations in the charts
const OperationNames = {
  [TPO.Batch]: 'Batch',
  [TPO.Query]: 'Query',
  [TPO.Read]:  'Reads per second',
  [TPO.Scan]:  'Scan',
  [TPO.UDF]:   'UDF',
  [TPO.Write]: 'Writes per second',
};

// the default chart layout 
const DefaultLayout = [{
  operations: [TPO.Read, TPO.Write],
  height: 350,
  header: '', // optional
}, {
  operations: [TPO.Batch, TPO.Query, TPO.Scan, TPO.UDF],
  header: '', // optional
  height: 200, 
}];

class Layout {
  constructor(layout) {
    this.layout = layout;
    this.num = nextNumber();
  }

  // convert from the EntityThroughputCharts layout form 
  // to the ChartLayout form
  toChartLayout() {
    const elements = [];
    const num = this.num;

    this.layout.forEach((row) => {
      let elm = {
        height: row.height,
        header: row.header || '',
      };

      const charts = [];
      row.operations.forEach((op) => {
        charts.push({
          operation: op,
          name: OperationNames[op],
          id: 'throughput_' + op + '_' + num,
        });
      });

      elm.charts = charts;
      elements.push(elm);
    });

    return elements;
  }

  // get all the operations of the layout
  getOperations() {
    const elements = this.toChartLayout();

    let operations = [];
    elements.forEach((elm) => {
      operations = operations.concat(elm.charts);
    });

    return operations;
  }
}

// EntityThroughputCharts displays charts for a 
// single entity like a node, namespace, udf or cluster
class EntityThroughputCharts extends React.Component {
  constructor(props) {
    super(props);

    // layout of the charts
    const layout = props.layout || DefaultLayout;
    this.layout = new Layout(layout);

    // options for the chart
    this.options = [{
      name: 'By Total',
      value: ThroughputGrouping.ByTotal,
    }, {
      name: 'By Namespace',
      value: ThroughputGrouping.ByNamespace
    }];

    // charts
    const operations = this.layout.getOperations();
    this.groupBy = this.props.groupBy || ThroughputGrouping.ByNamespace;
    this.tpcharts = new ThroughputCharts(this.props.getThroughput, operations, this.groupBy);

    this.onUpdateTimeWindow = this.onUpdateTimeWindow.bind(this);
    this.onOptionSelect = this.onOptionSelect.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;
    if (props.doNotSyncWithCurrentTime === nextProps.doNotSyncWithCurrentTime)
      return;

    if (nextProps.doNotSyncWithCurrentTime)
      this.tpcharts.stopSync();
    else 
      this.tpcharts.keepInSync();
  }

  componentWillUnmount() {
    this.tpcharts.destroy();
  }

  componentDidMount() {
    this.tpcharts.init();
  }
  
  onUpdateTimeWindow(from, to, inSync) {
    this.tpcharts.updateWindow(from, to, inSync);
  }

  onOptionSelect(option) {
    const op = this.options.find((o) => o.name === option);
    if (!op)
      return;

    this.tpcharts.setGrouping(op.value);
  }

  render() {
    let title = this.props.title || 'Throughput';
    const layout = this.layout.toChartLayout();
    const options = this.options.map((op) => op.name);
    const groupBy = this.options.find((o) => o.value === this.groupBy);

    return (
      <div>
        <ChartsLayout 
            title={title}
            layout={layout} 
            onUpdateTimeWindow={this.onUpdateTimeWindow}
            options={options} defaultOption={groupBy.name} onOptionSelect={this.onOptionSelect} />
      </div>
    );
  }
}

EntityThroughputCharts.PropTypes = {
  // function to fetch throughput
  //
  // getThroughput returns a promise with the response
  // from, to are in unix seconds
  getThroughput: PropTypes.func.isRequired,
  // title of the throughputs
  title: PropTypes.string,

  // grouping of each of the charts
  groupBy: PropTypes.string, 

  // the layout of the charts
  // only charts defined here will be rendered
  // Ex: [{
  //   types: ['read_tps', 'write_tps'],
  //   height: 350,
  // }, {
  //   height: 200,
  //   types: ['batch_read_tps', 'query_tps', 'scan_tps', 'udf_tps']
  // }];
  layout: PropTypes.object,
};

export default EntityThroughputCharts;


