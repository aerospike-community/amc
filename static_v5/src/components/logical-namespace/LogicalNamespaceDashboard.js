import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from 'components/Tabs';
import Histograms from 'components/Histograms';
import LogicalNamespaceLatency from 'components/logical-namespace/LogicalNamespaceLatency';
import LogicalNamespaceThroughput from 'components/logical-namespace/LogicalNamespaceThroughput';
import { getStatistics } from 'api/logicalNamespace';
import { LOGICAL_NAMESPACE_ACTIONS } from 'classes/entityActions';

class LogicalNamespaceDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stat: null,
    };

    const actions = LOGICAL_NAMESPACE_ACTIONS;
    this.views = [actions.View, actions.Latency];
    this.onViewSelect = this.onViewSelect.bind(this);
  }

  onViewSelect(view) {
    this.props.onViewSelect(view);
  }

  componentWillReceiveProps(nextProps) {
    let isSame = true;
    ['clusterID', 'namespaceName'].forEach((k) => {
      if (this.props[k] !== nextProps[k])
        isSame = false;
    });

    if (!isSame) {
      this.fetchNamespaces(nextProps);
    }
  }

  componentDidMount() {
    this.fetchNamespaces(this.props);
  }

  fetchNamespaces(props) {
    const { clusterID, namespaceName } = props;

    getStatistics(clusterID, namespaceName)
      .then((stat) => {
        this.setState({
          stat: stat
        });
      })
      .catch((message) => {
        console.error(message);
      });

  }

  render() {
    const { clusterID, namespaceName, view } = this.props;
    const { stat } = this.state;

    return (
      <div>
        <Tabs names={this.views} selected={view} onSelect={this.onViewSelect}/>

        {view === LOGICAL_NAMESPACE_ACTIONS.View &&
        <div>
          {stat !== null &&
          <Histograms objectSize={stat.objsz} timeToLive={stat.ttl} height={250} />
          }

          <LogicalNamespaceThroughput clusterID={clusterID} namespaceName={namespaceName} />
        </div>
        }

        {view === LOGICAL_NAMESPACE_ACTIONS.Latency && 
        <div>
          <LogicalNamespaceLatency clusterID={clusterID} namespaceName={namespaceName}/>
        </div>
        }
      </div>
      );
  }
}

LogicalNamespaceDashboard.PropTypes = {
  clusterID: PropTypes.string,
  namespaceName: PropTypes.string,
  view: PropTypes.string,
  // callback for when a view for the namespace dashboard is selected
  // onViewSelect('view')
  onViewSelect: PropTypes.func,
};

export default LogicalNamespaceDashboard;


