import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ClusterThroughput from 'components/cluster/ClusterThroughput';

// NodesOverview provides an overview of the nodes
class NodesOverview extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {clusterID} = this.props;
    return (
      <div>
        <div className="row">
          <div className="col-xl-12 as-section">
            <ClusterThroughput clusterID={clusterID} />
          </div>
        </div>
      </div>
    );
  }
}

NodesOverview.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default NodesOverview;

