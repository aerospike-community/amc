import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import bytes from 'bytes';

import { renderStatsInTable } from 'classes/renderUtil';
import { getNodesSummary } from 'api/node';

// NodesSummary provides a summary of the cluster nodes
class NodesSummary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      nodesSummary: {}, // map of nodeHost to summary
      expandedNodes: new Set(), 
    };

    this.onSelectNode = this.onSelectNode.bind(this);
    this.onExpandNode = this.onExpandNode.bind(this);
    this.onCollapseNode = this.onCollapseNode.bind(this);
  }

  onExpandNode(nodeHost) {
    const s = new Set(this.state.expandedNodes);
    s.add(nodeHost);

    this.setState({
      expandedNodes: s
    });
  }

  onCollapseNode(nodeHost) {
    const s = new Set(this.state.expandedNodes);
    s.delete(nodeHost);

    this.setState({
      expandedNodes: s
    });
  }

  onSelectNode(nodeHost) {
    const { clusterID } = this.props;
    this.props.onSelectNode(clusterID, nodeHost);
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
    const { expandedNodes } = this.state;
    const nodes = this.state.nodesSummary;
    const isSelectable = typeof(this.props.onSelectNode) === 'function';
    const memory = (s) => {
      return bytes(s['used-bytes']) + ' / ' +  bytes(s['total-bytes']);
    }

    let data = [];
    for (const nodeHost in nodes) {
      const node = nodes[nodeHost];
      const { stats } = node;
      const isExpanded = expandedNodes.has(nodeHost);
      const style = { fontSize: 12 };

      const row = (
        <tr key={nodeHost}>
          <td> 
            {isSelectable &&
            <span className="as-link" onClick={() => this.onSelectNode(nodeHost)}> 
              {nodeHost} 
            </span>
            }

            {!isSelectable && 
            <span> {nodeHost} </span>
            }

            <span className="pull-left">
              {isExpanded &&
              <span className="as-hide-stat" onClick={() => this.onCollapseNode(nodeHost)} />
              }

              {!isExpanded &&
              <span className="as-show-stat" onClick={() => this.onExpandNode(nodeHost)} />
              }
            </span>
          </td>
          <td> {stats.build} </td>
          <td> {stats.cluster_size} </td>
          <td> {memory(node.disk)} </td>
          <td> {memory(node.memory)} </td>
          <td> {stats.client_connections} </td>
        </tr>
      );
      data.push(row);

      if (expandedNodes.has(nodeHost)) {
        const r = renderStatsInTable(nodeHost, stats, 6);
        data = data.concat(r);
      }
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
  clusterID: PropTypes.string.isRequired,
  // the member nodes of the cluster
  nodeHosts: PropTypes.arrayOf(PropTypes.string).isRequired,
  // callback to select a node
  // onSelectNode(clusterID, nodeHost)
  onSelectNode: PropTypes.func,
};

export default NodesSummary;



