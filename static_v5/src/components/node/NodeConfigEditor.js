import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';

import ConfigEditorWithGraph from 'components/ConfigEditorWithGraph';
import { getConfig, setConfig } from 'api/node';
import { timeout } from 'classes/util';

// NodeConfigEditor shows the configurations of a node
class NodeConfigEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: true,  // to redraw the config
    };

    this.onEdit = this.onEdit.bind(this);
    this.fetchConfig = this.fetchConfig.bind(this);
  }

  fetchConfig() {
    const { clusterID, nodeHost } = this.props;

    return getConfig(clusterID, nodeHost)
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
    const { clusterID, nodeHost }  = this.props;

    const np = nextProps;
    if (np.clusterID === clusterID && np.nodeHost === nodeHost)
      return;

    // force redraw of config editor
    this.setState({show: false});
    timeout(() => this.setState({show: true}), 200);
  }

  onEdit(nh, configName, configValue) {
    const { clusterID, nodeHost }  = this.props;

    const successMsg  = `${nodeHost} - Config '${configName}' changed to '${configValue}'`;
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
    
    if (show === null)
      return null;

    return (
      <div>
        <ConfigEditorWithGraph 
          fetchConfig={this.fetchConfig} onEdit={this.onEdit} isEditable={true} />
      </div>
    );
  }
}

NodeConfigEditor.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
};

export default NodeConfigEditor;

