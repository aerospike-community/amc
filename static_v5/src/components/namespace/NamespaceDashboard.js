import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from 'components/Tabs';
import NamespaceThroughput from 'components/namespace/NamespaceThroughput';
import NamespaceLatency from 'components/namespace/NamespaceLatency';

class NamespaceDashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {clusterID, nodeHost, namespaceName, onViewSelect} = this.props;
    const view = this.props.view || 'Machine';
    return (
      <div>
        <div>
          <NamespaceThroughput clusterID={clusterID} nodeHost={nodeHost} namespaceName={namespaceName}/>
          <NamespaceLatency clusterID={clusterID} nodeHost={nodeHost} namespaceName={namespaceName}/>
        </div>
      </div>
      );
  }
}

NamespaceDashboard.PropTypes = {
  clusterID: PropTypes.string,
  nodeHost: PropTypes.string,
  namespaceName: PropTypes.string,
  view: PropTypes.string,
  // callback for when a view for the node dashboard is selected
  // onViewSelect('view')
  onViewSelect: PropTypes.func,
};

export default NamespaceDashboard;

