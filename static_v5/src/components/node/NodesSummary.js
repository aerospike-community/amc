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

  // ncols should be >= 3
  renderNodeStats(nodeHost, stats, ncols) {
    let rows = [];
    const keys = Object.keys(stats);

    // empty row
    rows.push(<tr key={'first' + nodeHost} style={{height: 25}}></tr>);

    // all stats
    const nr = Math.floor(ncols/3); // number of stats per row
    for (let i = 0; i < keys.length; i += nr) {
      const cols = []; 
      const style = { fontStyle: 'italic' };
      keys.slice(i, i+nr).forEach((k) => {
        cols.push(<td key={'empty' + k}></td>); // empty column
        cols.push(<td style={style} key={k}> {k} </td>);
        cols.push(<td style={style} key={k+'val'}> {stats[k] + ''} </td>);
      });

      for (let j = 3*nr; j < ncols; j++) {
        cols.push(<td key={'empty' + nodeHost + j}></td>); // empty column
      }

      rows.push(
        <tr key={nodeHost+i}>
          {cols}
        </tr>
      );
    }

    // empty row
    rows.push(<tr key={'last' + nodeHost} style={{height: 25}}></tr>);

    return rows;
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

            <span className="pull-right">
              {isExpanded &&
              <small className="as-link" onClick={() => this.onCollapseNode(nodeHost)}>
                Less
              </small>
              }

              {!isExpanded &&
              <small className="as-link" onClick={() => this.onExpandNode(nodeHost)}>
                More
              </small>
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
        const r = this.renderNodeStats(nodeHost, stats, 6);
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



