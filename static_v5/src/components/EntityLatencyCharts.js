import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import moment from 'moment';

import ChartsLayout from 'components/ChartsLayout';
import LatencyCharts from 'charts/LatencyCharts';
import { LatencyOperations as LO } from 'charts/constants';
import { nextNumber } from 'classes/util';

// names of the operations in the charts
const OperationNames = {
  [LO.Query]: 'Query',
  [LO.Read]:  'Reads',
  [LO.UDF]:   'UDF',
  [LO.Write]: 'Writes',
};

// the default chart layout 
const DefaultLayout = [{
  operations: [LO.Read, LO.Write],
  height: 350,
  header: '', // optional
}, {
  operations: [LO.Query, LO.UDF],
  header: '', // optional
  height: 200, 
}];

class Layout {
  constructor(layout) {
    this.layout = layout;
    this.num = nextNumber();
  }

  // convert from the EntityLatencyCharts layout form 
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
          id: 'latency' + op + '_' + num,
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

// EntityLatencyCharts displays charts for a 
// single entity like a node, namespace, udf or cluster
class EntityLatencyCharts extends React.Component {
  constructor(props) {
    super(props);

    // layout of the charts
    const layout = props.layout || DefaultLayout;
    this.layout = new Layout(layout);

    // charts
    const operations = this.layout.getOperations();
    this.latencyCharts = new LatencyCharts(this.props.getLatency, operations);

    this.onUpdateTimeWindow = this.onUpdateTimeWindow.bind(this);
  }

  componentWillUnmount() {
    this.latencyCharts.destroy();
  }

  componentDidMount() {
    this.latencyCharts.init();
  }
  
  onUpdateTimeWindow(from, to, inSync) {
    this.latencyCharts.updateWindow(from, to, inSync);
  }

  render() {
    let title = this.props.title || 'Latency';
    const layout = this.layout.toChartLayout();

    return (
      <div>
        <ChartsLayout 
            title={title}
            layout={layout} 
            onUpdateTimeWindow={this.onUpdateTimeWindow} />
      </div>
    );
  }
}

EntityLatencyCharts.PropTypes = {
  // function to fetch throughput
  //
  // getLatency returns a promise with the response
  // from, to are in unix seconds
  getLatency: PropTypes.func.isRequired,
  // title of the throughputs
  title: PropTypes.string,

  // the layout of the charts
  // only charts defined here will be rendered
  // Ex: [{
  //   types: [LO.Read, LO.Write],
  //   height: 350,
  // }, ...
  // ];
  layout: PropTypes.object,
};

export default EntityLatencyCharts;



