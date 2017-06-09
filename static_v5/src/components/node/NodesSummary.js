import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import { getNodesSummary } from 'api/node';
import bytes from 'bytes';

// NodesSummary provides a summary of the cluster nodes
class NodesSummary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      nodesSummary: {}, // map of nodeHost to summary
    };
  }

  fetchSummary(clusterID, nodeHosts) {
    if (!clusterID || !nodeHosts || nodeHosts.length === 0)
      return;

    getNodesSummary(clusterID, nodeHosts)
      .then((summary) => {
        this.setState({
          nodesSummary: summary
        });
      })
      .catch((message) => {
        // TODO
        console.error(message);
      });
  }

  componentWillMount() {
    const { clusterID, nodeHosts } = this.props;
    this.fetchSummary(clusterID, nodeHosts);
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;
    const { clusterID, nodeHosts } = nextProps;

    if (props.clusterID !== clusterID 
          // naive check for nodeHosts equality
          // refetching does not matter, and it happens very rarely
          || props.nodeHosts.join('') !== nodeHosts.join('')) {
      this.fetchSummary(clusterID, nodeHosts);
    }
  }

  nodes() {
    const nodes = this.state.nodesSummary;
    const memory = (s) => {
      return bytes(s['used-bytes']) + ' / ' +  bytes(s['total-bytes']);
    }

    const data = [];
    for (const nodeHost in nodes) {
      const node = nodes[nodeHost];
      const { stats } = node;
      const row = (
        <tr key={nodeHost}>
          <td> {nodeHost} </td>
          <td> {stats.build} </td>
          <td> {stats.cluster_size} </td>
          <td> {memory(node.disk)} </td>
          <td> {memory(node.memory)} </td>
          <td> {stats.client_connections} </td>
        </tr>
      );
      data.push(row);
    }

    return data;
  }

  render() {
    const nodes = this.nodes();
    return (
      <div>
        <div className="row">
          <div className="col-xl-12 as-section-header">
            Nodes
          </div>
        </div>
        <div className="row">
          <div className="col-xl-12"> 
            <Table size="sm" bordered>
              <thead>
                <tr>
                  <th> Host</th>
                  <th> Build </th>
                  <th> Cluster Size </th>
                  <th> Disk </th>
                  <th> RAM </th>
                  <th> Cluster Connections </th>
                </tr>
              </thead>
              <tbody>
                {nodes}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    );
  }
}

NodesSummary.PropTypes = {
  clusterID: PropTypes.string.required,
  // the member nodes of the cluster
  nodeHosts: PropTypes.arrayOf(PropTypes.string).required,
};

export default NodesSummary;



