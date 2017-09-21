import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import moment from 'moment';
import classNames from 'classnames';
import { Jumbotron } from 'reactstrap';

class ClusterAlerts extends React.Component {
  constructor(props) {
    super(props);
  }

  // bucket the alerts by date
  bucketAlerts() {
    let alerts = this.props.alerts.slice(); // copy
    alerts.sort((a, b) => b.lastOccured - a.lastOccured); 

    const day = [];
    const week = [];
    const month = [];
    const older = [];

    let i = 0;
    alerts.forEach((a) => {
      const tm = moment(new Date(a.lastOccured));

      const aday = moment().subtract(1, 'days');
      const aweek = moment().subtract(7, 'days');
      const amonth = moment().subtract(30, 'days');

      if (tm.isSameOrAfter(aday))
        day.push(a);
      else if (tm.isSameOrAfter(aweek))
        week.push(a);
      else if (tm.isSameOrAfter(amonth))
        month.push(a);
      else
        older.push(a);

      i = (i+1)%3;
    });

    return [{
      name: 'Last 24 hrs',
      alerts: day
    }, {
      name: 'Last 7 days',
      alerts: week
    }, {
      name: 'Last 30 days',
      alerts: month
    }, {
      name: 'Older than 30 days',
      alerts: older
    }];
  }

  renderAlerts() {
    const data = [];
    const buckets = this.bucketAlerts();

    buckets.forEach((bucket) => {
      if (bucket.alerts.length === 0)
        return;

      const style = data.length === 0 ? {} : {paddingTop: '30px'};
      data.push(
        <tr key={bucket.name}>
          <td style={style}> {bucket.name} </td>
        </tr>
      );

      bucket.alerts.forEach((alert) => {
        const {id, status, lastOccured, desc} = alert;
        const time = moment(new Date(lastOccured));
        const cn = classNames({
          'table-danger': status === 'red',
          'table-warning': status === 'yellow',
          'table-success': status === 'green'
        });

        const row = (
          <tr key={id} className={cn}>
            <td> 
              {time.format('MMM Do hh:mm a')} 
              <span style={{marginLeft: 10}}> {desc} </span> 
            </td>
          </tr>
        );
        data.push(row);
      });
    });

    return data;
  }

  render() {
    const { alerts } = this.props;
    if (alerts.length === 0) {
      return (
        <Jumbotron>
          <h3> All clear </h3>
        </Jumbotron>
      );
    }

    return (
      <div className="row">
        <div className="col-xl-12"> 
          <Table size="sm" bordered hover>
            <thead>
              <tr>
                <th> Alert </th>
              </tr>
            </thead>
            <tbody>
              {this.renderAlerts()}
            </tbody>
          </Table>
        </div>
      </div>
    );
  }
}

ClusterAlerts.PropTypes = {
  // all the alerts to show
  alerts: PropTypes.arrayOf(PropTypes.object),
};

export default ClusterAlerts;


