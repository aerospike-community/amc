import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ConfigEditor from 'components/ConfigEditor';
import AlertModal from 'components/AlertModal';
import { getNodesConfig } from 'api/clusterConnections';
import { setConfig } from 'api/node';

// ClusterNodesConfig shows the configurations of the nodes of a cluster
class ClusterNodesConfig extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      config: null,
      editSuccessful: false,
      editFailed: false,
      editMessage: '',
    };

    this.onEdit = this.onEdit.bind(this);
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

  onEdit(nodeHost, configName, configValue) {
    const { clusterID }  = this.props;
    const p = setConfig(clusterID, nodeHost, {
      [configName]: configValue
    });

    const setState = (editSuccessful, editFailed, editMessage) => {
      this.setState({
        editSuccessful: editSuccessful,
        editFailed: editFailed,
        editMessage: editMessage
      });
    };

    p.then((config) => {
        const editMessage = `${nodeHost} - Config '${configName}' changed to '${configValue}'`;
        setState(true, false, editMessage);

        window.setTimeout(() => setState(false, false, ''), 2000);
        this.fetchConfig(clusterID);
      })
      .catch((message) => {
        const editMessage = `${nodeHost} - Failed to change '${configName}' to '${configValue}'`;
        setState(false, true, editMessage);

        window.setTimeout(() => setState(false, false, ''), 2000);
        this.fetchConfig(clusterID);
      });

    return p;
  }

  render() {
    const { config, editSuccessful, editFailed, editMessage } = this.state;

    if (config === null)
      return null;

    return (
      <div>
        <ConfigEditor config={config} onEdit={this.onEdit} isEditable={true} />

        {editSuccessful &&
          <AlertModal header="Success" message={editMessage} type="success" />
        }

        {editFailed && 
          <AlertModal header="Failed" message={editMessage} type="error" />
        }
      </div>
    );
  }
}

ClusterNodesConfig.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default ClusterNodesConfig;


