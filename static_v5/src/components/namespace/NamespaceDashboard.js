import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from 'components/Tabs';
import Histograms from 'components/Histograms';
import NamespacesTable from 'components/namespace/NamespacesTable';
import NamespaceLatency from 'components/namespace/NamespaceLatency';
import NamespaceThroughput from 'components/namespace/NamespaceThroughput';
import NamespaceConfigEditor from 'components/namespace/NamespaceConfigEditor';
import { getStatistics } from 'api/namespace';
import { NAMESPACE_ACTIONS, filterNamespaceActions } from 'classes/entityActions';
import { VIEW_TYPE } from 'classes/constants';
import { whenClusterHasCredentials } from 'classes/security';

class NamespaceDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stat: null,
      views: [],
    };

    this.onViewSelect = this.onViewSelect.bind(this);
  }

  setViews(props) {
    this.setState({
      views: []
    });

    const { clusterID, namespaceName } = props;
    whenClusterHasCredentials(clusterID, () => {
      const actions = [NAMESPACE_ACTIONS.View, NAMESPACE_ACTIONS.Latency, 
                       NAMESPACE_ACTIONS.Configuration];

      const views = filterNamespaceActions(actions, clusterID, namespaceName);
      this.setState({
        views: views
      });
    });
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

    if (!isSame) {
      this.fetchNamespaces(nextProps);
      this.setViews(nextProps);
    }
  }

  componentDidMount() {
    this.fetchNamespaces(this.props);
    this.setViews(this.props);
  }

  fetchNamespaces(props) {
    const { clusterID, nodeHost, namespaceName } = props;

    getStatistics(clusterID, nodeHost, namespaceName)
      .then((stat) => {
        this.setState({
          stat: stat,
        });
      })
      .catch((message) => {
        console.error(message);
      });
  }

  render() {
    const {clusterID, nodeHost, namespaceName, onViewSelect, view} = this.props;
    const { stat, views } = this.state;
    const namespaces = stat ? [stat] : [];

    return (
      <div>
        <Tabs names={views} selected={view} onSelect={this.onViewSelect}/>

        {view === NAMESPACE_ACTIONS.View &&
        <div>
          <NamespacesTable namespaces={namespaces} initiallyExpandAll={true}/>

          {stat !== null &&
          <Histograms objectSize={stat.objsz} timeToLive={stat.ttl} height={250} />
          }

          <NamespaceThroughput clusterID={clusterID} nodeHost={nodeHost} namespaceName={namespaceName}/>
        </div>
        }

        {view === NAMESPACE_ACTIONS.Latency && 
        <NamespaceLatency clusterID={clusterID} nodeHost={nodeHost} namespaceName={namespaceName}/>
        }

        {view === NAMESPACE_ACTIONS.Configuration && 
        <NamespaceConfigEditor clusterID={clusterID} nodeHost={nodeHost} namespaceName={namespaceName}/>
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

