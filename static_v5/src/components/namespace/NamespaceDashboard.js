import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import NamespaceThroughput from 'components/namespace/NamespaceThroughput';
import NamespaceLatency from 'components/namespace/NamespaceLatency';
import NamespacesTable from 'components/namespace/NamespacesTable';
import { getStatistics } from 'api/namespace';

class NamespaceDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      namespaces: []
    };
  }

  componentWillReceiveProps(nextProps) {
    let isSame = true;
    ['clusterID', 'nodeHost', 'namespaceName'].forEach((k) => {
      if (this.props[k] !== nextProps[k])
        isSame = false;
    });

    if (!isSame)
      this.fetchNamespaces();
  }

  componentDidMount() {
    this.fetchNamespaces();
  }

  fetchNamespaces() {
    const { clusterID, nodeHost, namespaceName } = this.props;

    getStatistics(clusterID, nodeHost, namespaceName)
      .then((stat) => {
        this.setState({
          namespaces: [stat]
        });
      })
      .catch((message) => {
        console.error(message);
      });
  }

  render() {
    const {clusterID, nodeHost, namespaceName, onViewSelect} = this.props;
    const view = this.props.view || 'Machine';
    const { namespaces } = this.state;
    return (
      <div>
        <div>
          <NamespacesTable namespaces={namespaces} />
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

