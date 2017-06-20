import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import VisibleEntityTree from 'containers/cluster/VisibleEntityTree';
import VisibleClusterToolbar from 'containers/cluster/VisibleClusterToolbar';
import VisibleAddClusterModal from 'containers/cluster/VisibleAddClusterModal';
import VisibleClusterConnectionModal from 'containers/cluster/VisibleClusterConnectionModal';
import Spinner from 'components/Spinner';

class ClusterConnections extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    if (!this.props.isInitialized)
      this.props.initClusters();
  }

  render() {
    let content;
    if (this.props.isFetching) {
      content = <h5> <Spinner /> Loading ... </h5>;
    } else {
      content = (
        <div>
          <VisibleClusterToolbar />
          <VisibleEntityTree />
          {this.props.displayAddCluster &&
           <VisibleAddClusterModal />}
          {this.props.displayAuthCluster &&
           <VisibleClusterConnectionModal />
          }
        </div>
      );
    }
    return content;
  }
}

ClusterConnections.PropTypes = {
  // true when in the process of adding a new connection
  displayAddCluster: PropTypes.bool,
  // true when in the process of authenticating a connection
  displayAuthCluster: PropTypes.bool,
  // are clusters being fetched
  isFetching: PropTypes.bool,
  // have the clusters been initialized
  isInitialized: PropTypes.bool,
  // initialize the clusters
  initClusters: PropTypes.func,
};

export default ClusterConnections;

