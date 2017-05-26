import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

// ClusterNodes provides an overview of the cluster nodes
class ClusterNodes extends React.Component {
  constructor(props) {
    super(props);
  }

  // get the nodes data
  // FIXME get real data
  nodes() {
    const nodes = ['172.17.0.4:3000', '172.17.0.5'];
    const data = [];
    nodes.forEach((n) => {
      const d = (
          <tr key={n}>
            <td> {n} </td>
            <td> 3.12 </td>
            <td> 2 </td>
            <td> 0 </td>
            <td> 4GB </td>
            <td> 123 </td>
          </tr>
      );
      data.push(d);
    });

    return data;
  }

  render() {
    const nodes = this.nodes();
    return (
      <div>
        <div className="row">
          <div className="col-12 as-section-header">
            Nodes
          </div>
        </div>
        <div className="row">
          <div className="col-12"> 
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

ClusterNodes.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterNodes;



