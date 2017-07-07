import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import NodeThroughput from 'components/node/NodeThroughput';

// NamespacesOverview provides an overview of the namespace
class NamespacesOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      namespaces: [],
    };
  }

  render() {
    const { clusterID, nodeHost}  = this.props;
    
    return (
      <div>
        <h4 style={{margin: 10}}> Namespaces Overview </h4>

        <div className="row">
          <div className="col-xl-12 as-section">
            <NodeThroughput clusterID={clusterID} nodeHost={nodeHost} />
          </div>
        </div>
      </div>
    );
  }
}

NamespacesOverview.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  // the node of the namespaces
  nodeHost: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default NamespacesOverview;



