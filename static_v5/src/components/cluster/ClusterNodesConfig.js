import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ConfigEditor from 'components/ConfigEditor';
import { getNodesConfig } from 'api/clusterConnections';
import { setConfig } from 'api/node';
import { timeout } from 'classes/util';

// ClusterNodesConfig shows the configurations of the nodes of a cluster
class ClusterNodesConfig extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: true,  // to redraw the config
    };

    this.fetchConfig = this.fetchConfig.bind(this);
    this.onEdit = this.onEdit.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID }  = this.props;

    const np = nextProps;
    if (np.clusterID === clusterID)
      return;

    // force redraw of config editor
    this.setState({show: false});
    timeout(() => this.setState({show: true}), 200);
  }

  fetchConfig() {
    const { clusterID } = this.props;
    return getNodesConfig(clusterID) 
      .then((response) => {
        const configs = {};
        const nodes = Object.keys(response);
        nodes.forEach((n) => {
          configs[n] = {
            all: response[n].config
          }
        });

        return configs;
      });
  }

  onEdit(nodeHost, configName, configValue) {
    const { clusterID }  = this.props;

    const successMsg = `${nodeHost} - Config '${configName}' changed to '${configValue}'`;
    const failMsg = `${nodeHost} - Failed to change '${configName}' to '${configValue}'`;

    const config = {
      [configName]: configValue
    };

    return setConfig(clusterID, nodeHost, config)
     .then((config) => successMsg)
     .catch((message) => { throw failMsg });
  }

  render() {
    const { show } = this.state;
    
    if (!show)
      return null;

    return (
      <div>
        <ConfigEditor fetchConfig={this.fetchConfig} onEdit={this.onEdit} isEditable={true} />
      </div>
    );
  }
}

ClusterNodesConfig.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default ClusterNodesConfig;


