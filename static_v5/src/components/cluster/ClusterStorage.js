import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import * as d3 from 'd3';

import StorageChart from '../../classes/charts/StorageChart';
import { nextNumber } from '../../classes/util';
import 'bootstrap/dist/css/bootstrap.css';

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

  componentWillUnmount() {
    this.chart.destroy();
  }

  renderStorage(storage) {
    let nodeStorage = [];
    for (const host in storage.nodeDetails) {
      const node = storage.nodeDetails[host];
      nodeStorage.push(
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
            <th> </th>
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
            <svg id={this.id} width="200" height="200"> </svg>
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
};

export default ClusterStorage;
