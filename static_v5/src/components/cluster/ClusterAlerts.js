import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import moment from 'moment';
import classNames from 'classnames';

class ClusterAlerts extends React.Component {
  constructor(props) {
    super(props);
  }

  renderAlerts() {
    const data = [];
    let alerts = this.props.alerts.slice(); // copy

    alerts.sort((a, b) => b.lastOccured - a.lastOccured); 
    alerts.forEach((alert) => {
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
            {time.format('h:mm a')} 
            <span style={{marginLeft: 10}}> {desc} </span> 
          </td>
        </tr>
      );
      data.push(row);
    });

    return data;
  }

  render() {
    const { alerts } = this.props;
    if (alerts.length === 0) {
      return (
        <h5 style={{margin: 10}}> All clear </h5>
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


