import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import 'bootstrap/dist/css/bootstrap.css';

// ClusterStorage provides an overview of the cluster storage
class ClusterStorage extends React.Component {
  constructor(props) {
    super(props);
  }

  renderStorage(storage, header) {
    const usedBytes = 'used-bytes';
    const totalBytes = 'total-bytes';
    const freeBytes = 'free-bytes';

    let nodeDetails = [];
    for (const host in storage.nodeDetails) {
      const node = storage.nodeDetails[host];
      nodeDetails.push(
        <tr key={node}> 
          <td> {host} </td>
          <td> {node[usedBytes]} </td>
          <td> {node[freeBytes]} </td>
          <td> {node[totalBytes]}</td>
        </tr>
      );
    }

    return (
        <Table size="sm" bordered>
          <thead>
            <tr>
              <th> {header} </th>
              <th> Used </th>
              <th> Free </th>
              <th> Total </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td> Cluster </td>
              <td> {storage[usedBytes]} </td>
              <td> {storage[freeBytes]} </td>
              <td> {storage[totalBytes]}</td>
            </tr>
            {nodeDetails}
          </tbody>
        </Table>
    );
  }

  render() {
    const { disk, memory } = this.props;
    return (
      <div className="row">
        <div className="col-6"> {this.renderStorage(memory, 'RAM')} </div>
        <div className="col-6"> {this.renderStorage(disk, 'Disk')} </div>
      </div>
    );
  }
}

ClusterStorage.PropTypes = {
  // memory usage of the cluster
  memory: PropTypes.object.required,
  // disk usage of the cluster
  disk: PropTypes.object.required,
};

export default ClusterStorage;



