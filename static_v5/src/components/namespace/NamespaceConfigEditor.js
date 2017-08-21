import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';

import ConfigEditor from 'components/ConfigEditor';
import { getConfig, setConfig } from 'api/namespace';

// NamespaceConfigEditor shows the configurations of a node
class NamespaceConfigEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: true,  // to redraw the config
    };

    this.onEdit = this.onEdit.bind(this);
    this.fetchConfig = this.fetchConfig.bind(this);
  }

  fetchConfig() {
    const { clusterID, nodeHost, namespaceName } = this.props;

    return getConfig(clusterID, nodeHost, namespaceName)
      .then((response) => {
        const config = {
          [nodeHost]: {
            all: response.config,
          },
        };

        return config;
      });
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID, nodeHost, namespaceName }  = this.props;

    const np = nextProps;
    if (np.clusterID === clusterID && np.nodeHost === nodeHost && np.namespaceName === namespaceName)
      return;

    // force redraw of config editor
    this.setState({show: false});
    window.setTimeout(() => this.setState({show: true}), 200);
  }

  onEdit(nh, configName, configValue) {
    const { clusterID, nodeHost, namespaceName }  = this.props;

    const successMsg  = `${namespaceName} - Config '${configName}' changed to '${configValue}' on '${nodeHost}`;
    const failMsg = `${namespaceName} - Failed to change '${configName}' to '${configValue}' on '${nodeHost}`;

    const config = {
      [configName]: configValue
    };

    return setConfig(clusterID, nodeHost, namespaceName, config)
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

NamespaceConfigEditor.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
  namespaceName: PropTypes.string.isRequired,
};

export default NamespaceConfigEditor;


