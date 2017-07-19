import moment from 'moment';

import AbstractStackedAreaChart from 'charts/AbstractStackedAreaChart';
import { ThroughputGrouping as TG } from 'charts/constants';

// create a new throughput chart
export function newThroughputChart(operation, selector, data) {
  if (operation === TG.ByNamespace)
    return new NamespaceChart(selector, data);

  if (operation === TG.ByTotal)
    return new TotalChart(selector, data);

  throw `Unknown operation:${operation}`;
}

// TotalChart draws a chart for the throughput displaying the total
//
// selector - selects an svg element
// throughput - [
//  { // each of the charts
//    key: '127.0.0.1:3000', // label name
//    values: [
//      { // each of the individual values
//        value: 12345,
//        timestamp: 1496807162727,
//      }, ...]
//  }, ...]
class TotalChart extends AbstractStackedAreaChart {
  constructor(selector, throughput) {
    super(selector, throughput, true);
  }
  
  // x value of data point
  x(d) {
    return d.timestamp;
  }

  // y value of data point
  y(d) {
    return d.value;
  }
}

// NamespaceChart draws a chart for the throughput displaying namespaces
//
// selector - selects an svg element
// throughput - [
//  { // each of the charts
//    key: '127.0.0.1:3000', // label name
//    values: [
//      { // each of the individual values
//        successful: 12345,
//        failed: 435,
//        timestamp: 1496807162727,
//      }, ...]
//  }, ...]
class NamespaceChart extends AbstractStackedAreaChart {
  constructor(selector, throughput) {
    super(selector, throughput, true);
  }
  
  // x value of data point
  x(d) {
    return d.timestamp;
  }

  // y value of data point
  y(d) {
    return d.successful;
  }

  // content generator for the tooltip
  tooltip(obj) {
    let ttip = '<div>';

    // time
    const time = moment(obj.value);
    ttip += '<div style="font-weight: bold; margin-bottom: 5px">' + time.format('HH:mm:ss') + '</div>';

    ttip += '<table>' +
              '<tbody>' +
                '<tr>' +
                  '<td> </td>' +
                  '<td> </td>' +
                  '<td> Failed </td>' +
                  '<td> Success </td>' +
                  '<td> Total </td>' +
                '</tr>';

    let failed = 0, success = 0;
    obj.series.forEach((s) => {
      const p = s.point;
      if (!p)
        return;

      ttip += toRow(s.color, s.key, p.failed, p.successful);

      failed += p.failed;
      success += p.successful;
    });

    // total
    ttip += toRow('white', 'TOTAL', failed, success);

    // close html
    ttip += '</tbody></table>';
    ttip += '</div>';

    return ttip;


    function toRow(color, key, failed, success) {
      let s = '<tr>';

      // coloured box
      const style = ['width: 10px', 'height: 10px', 'background: ' + color, 'border: 1px solid #999'];
      s += '<td> <div style="' + style.join(';') + '"></div> </td>';
      // name 
      s += '<td>' + key + '</td>';
      // failed
      s += '<td>' + failed + '</td>';
      // success
      s += '<td>' + success + '</td>';
      // total
      s += '<td>' + (failed+success) + '</td>';

      s += '</tr>';

      return s;
    }
  }
}

