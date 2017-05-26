import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

// ClusterSummary provides a summary of the nodes and namespaces in the
// cluster
class ClusterSummary extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const co = this.props.clusterOverview;
    const { nodes, namespaces } = co;
    const buildVersion = co.clusterBuilds.latestVersion;

    return (
      <div> 
        <div>
          <span className="font-weight-bold"> Nodes: {nodes.length} </span>
          {nodes.map((node) => node + ' ')}
        </div>
        <div>
          <span className="font-weight-bold"> Namespaces: {namespaces.length} </span>
          {namespaces.map((ns) => ns + ' ')}
        </div>
        <div>
          <span className="font-weight-bold"> Build </span>
          {buildVersion}
        </div>
      </div>
    );
  }
}

ClusterSummary.PropTypes = {
  // the cluster overview
  clusterOverview: PropTypes.object.required,
};

export default ClusterSummary;
