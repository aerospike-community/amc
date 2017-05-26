import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

// ClusterNamespaces provides an overview of the cluster namespaces
class ClusterNamespaces extends React.Component {
  constructor(props) {
    super(props);
  }

  // get the namespaces data
  // FIXME get real data
  namespaces() {
    const namespaces = ['test', 'exam'];
    const data = [];
    namespaces.forEach((n) => {
      const d = (
          <tr key={n}>
            <td> {n} </td>
            <td> 12 </td>
            <td> 12 </td>
            <td> 1GB </td>
            <td> 2GB </td>
            <td> 11 </td>
          </tr>
      );
      data.push(d);
    });

    return data;
  }

  render() {
    const namespaces = this.namespaces();
    return (
      <div>
        <div className="row">
          <div className="col-12 as-section-header">
            Namespaces
          </div>
        </div>
        <div className="row">
          <div className="col-12"> 
            <Table size="sm" bordered>
              <thead>
                <tr>
                  <th> Host</th>
                  <th> Master </th>
                  <th> Replica </th>
                  <th> Disk </th>
                  <th> RAM </th>
                  <th> Expired Objects </th>
                </tr>
              </thead>
              <tbody>
                {namespaces}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    );
  }
}

ClusterNamespaces.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterNamespaces;



