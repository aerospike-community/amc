import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import bytes from 'bytes';

// NamespacesTable provides a tabular representation of the namespaces 
// of a cluster
class NamespacesTable extends React.Component {
  constructor(props) {
    super(props);
  }

  namespaces() {
    const { namespaces } = this.props;
    const memory = (s) => {
      return bytes(s['used-bytes']) + ' / ' +  bytes(s['total-bytes']);
    }

    const data = [];
    namespaces.forEach((ns) => {
      const { stats, name } = ns;
      const row = (
        <tr key={name}>
          <td> {name} </td>
          <td> {memory(ns.disk)} </td>
          <td> {memory(ns.memory)} </td>
          <td> {stats['repl-factor']} </td>
          <td> {stats['master-objects']} </td>
          <td> {stats['prole-objects']} </td>
        </tr>
      );
      data.push(row);
    });

    return data;
  }

  render() {
    const namespaces = this.namespaces();
    return (
      <div>
        <div className="row">
          <div className="col-xl-12 as-section-header">
            Namespaces
          </div>
        </div>
        <div className="row">
          <div className="col-xl-12"> 
            <Table size="sm" bordered>
              <thead>
                <tr>
                  <th> Name </th>
                  <th> Disk </th>
                  <th> RAM </th>
                  <th> Replication factor </th>
                  <th> Master Objects </th>
                  <th> Replication Objects </th>
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

NamespacesTable.PropTypes = {
  namespaces: PropTypes.arrayOf(PropTypes.object),
};

export default NamespacesTable;

