import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ConfigEditor from 'components/ConfigEditor';
import { getNodesConfig } from 'api/clusterConnections';

// ClusterNodesConfig shows the configurations of the nodes of a cluster
class ClusterNodesConfig extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      config: null,
    };
  }

  fetchConfig(clusterID) {
    getNodesConfig(clusterID)
      .then((response) => {
        const configs = {};
        const nodes = Object.keys(response);
        nodes.forEach((n) => {
          configs[n] = {
            all: response[n].config
          }
        });
        this.setState({
          config: configs,
        });
      })
      .catch((message) => {
        console.error(message);
      });
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID }  = this.props;

    const np = nextProps;
    if (np.clusterID !== clusterID)
      this.fetchConfig(np.clusterID);
  }

  componentDidMount() {
    const { clusterID }  = this.props;
    this.fetchConfig(clusterID);
  }

  render() {
    const { config } = this.state;

    if (config === null)
      return null;

    return (
        <ConfigEditor config={config} isEditable="false"/>
    );
  }
}

ClusterNodesConfig.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default ClusterNodesConfig;


