import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import bytes from 'bytes';

import StorageChart from '../../charts/StorageChart';
import { nextNumber } from '../../classes/util';

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
    this.chart = new StorageChart('#' + this.id, nodeDetails);
    this.chart.draw();
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
      <Table size="sm" bordered>
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
          <div className="col-12"> 
            <svg id={this.id} className="as-pie-chart"> </svg>
          </div>
        </div>
        <div className="row">
          <div className="col-12"> {this.renderStorage(storage)} </div>
        </div>
      </div>
    );
  }
}

ClusterStorage.PropTypes = {
  // storage details of the cluster
  storage: PropTypes.object.required,
  // the name of the storage. Ex: RAM, Disk
  name: PropTypes.string,
};

export default ClusterStorage;
