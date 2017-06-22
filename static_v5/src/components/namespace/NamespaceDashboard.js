import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from 'components/Tabs';
import NamespaceThroughput from 'components/namespace/NamespaceThroughput';
import NamespaceLatency from 'components/namespace/NamespaceLatency';
import NamespacesTable from 'components/namespace/NamespacesTable';
import { getStatistics } from 'api/namespace';
import { NAMESPACE_ACTIONS } from 'classes/entityActions';

class NamespaceDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      namespaces: []
    };

    this.views = [NAMESPACE_ACTIONS.View, NAMESPACE_ACTIONS.Latency];
    this.onViewSelect = this.onViewSelect.bind(this);
  }

  onViewSelect(view) {
    this.props.onViewSelect(view);
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
    const {clusterID, nodeHost, namespaceName, onViewSelect, view} = this.props;
    const { namespaces } = this.state;

    return (
      <div>
        <Tabs names={this.views} selected={view} onSelect={this.onViewSelect}/>

        {view === NAMESPACE_ACTIONS.View &&
        <div>
          <NamespacesTable namespaces={namespaces} />
          <NamespaceThroughput clusterID={clusterID} nodeHost={nodeHost} namespaceName={namespaceName}/>
        </div>
        }

        {view === NAMESPACE_ACTIONS.Latency && 
        <NamespaceLatency clusterID={clusterID} nodeHost={nodeHost} namespaceName={namespaceName}/>
        }
      </div>
      );
  }
}

NamespaceDashboard.PropTypes = {
  clusterID: PropTypes.string,
  nodeHost: PropTypes.string,
  namespaceName: PropTypes.string,
  view: PropTypes.string,
  // callback for when a view for the namespace dashboard is selected
  // onViewSelect('view')
  onViewSelect: PropTypes.func,
};

export default NamespaceDashboard;

