import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import bytes from 'bytes';

import StorageChart from 'charts/StorageChart';
import { nextNumber } from 'classes/util';

const usedBytes = 'used-bytes';
const totalBytes = 'total-bytes';
const freeBytes = 'free-bytes';

// ClusterStorage provides an overview of the cluster storage
class ClusterStorage extends React.Component {
  constructor(props) {
    super(props);

    this.id = 'cluster_storage' + nextNumber();
  }

  componentDidMount() {
    const { nodeDetails } = this.props.storage;
    const total = this.computeTotal(nodeDetails);
    const title = bytes(total);
    this.chart = new StorageChart('#' + this.id, nodeDetails, title);
    this.chart.draw();
  }

  computeTotal(nodeDetails, type = totalBytes) {
    let total = 0;
    for (let host in nodeDetails) {
      const node = nodeDetails[host];
      total += node[type];
    }
    return total;
  }

  renderStorage(storage) {
    let nodeStorage = [];
    for (const host in storage.nodeDetails) {
      const node = storage.nodeDetails[host];
      nodeStorage.push(
        <tr key={host}> 
          <td> {host} </td>
          <td> {bytes(node[usedBytes])} </td>
          <td> {bytes(node[freeBytes])} </td>
          <td> {bytes(node[totalBytes])}</td>
        </tr>
      );
    }

    return (
      <Table size="sm" bordered hover>
        <thead>
          <tr>
            <th> {this.props.name} </th>
            <th> Used </th>
            <th> Free </th>
            <th> Total </th>
          </tr>
        </thead>
        <tbody>
          <tr key={'cluster'}>
            <td> Cluster </td>
            <td> {bytes(storage[usedBytes])} </td>
            <td> {bytes(storage[freeBytes])} </td>
            <td> {bytes(storage[totalBytes])}</td>
          </tr>
          {nodeStorage}
        </tbody>
      </Table>
    );
  }

  render() {
    const { storage } = this.props;
    return (
      <div>
        <div className="row">
          <div className="col-xl-12"> 
            <svg id={this.id} className="as-pie-chart"> </svg>
          </div>
        </div>
      </div>
    );
  }
}

ClusterStorage.PropTypes = {
  // storage details of the cluster
  storage: PropTypes.object.isRequired,
  // the name of the storage. Ex: RAM, Disk
  name: PropTypes.string,
};

export default ClusterStorage;
