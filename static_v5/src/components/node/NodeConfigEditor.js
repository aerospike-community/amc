import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';

import ConfigEditor from 'components/ConfigEditor';
import AlertModal from 'components/AlertModal';
import { getConfig, setConfig } from 'api/node';

// NodeConfigEditor shows the configurations of a node
class NodeConfigEditor extends React.Component {
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

  fetchConfig(clusterID, nodeHost) {
    getConfig(clusterID, nodeHost)
      .then((response) => {
        this.setState({
          config: {
            [nodeHost]: {
              all: response.config,
            },
          }
        });
      })
      .catch((message) => {
        console.error(message);
      });
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID, nodeHost }  = this.props;

    const np = nextProps;
    if (np.clusterID !== clusterID || np.nodeHost !== nodeHost)
      this.fetchConfig(np.clusterID, np.nodeHost);
  }

  componentDidMount() {
    const { clusterID, nodeHost }  = this.props;
    this.fetchConfig(clusterID, nodeHost);
  }

  onEdit(nh, configName, configValue) {
    const { clusterID, nodeHost }  = this.props;
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
        this.fetchConfig(clusterID, nodeHost);
      })
      .catch((message) => {
        const editMessage = `${nodeHost} - Failed to change '${configName}' to '${configValue}'`;
        setState(false, true, editMessage);

        window.setTimeout(() => setState(false, false, ''), 2000);
        this.fetchConfig(clusterID, nodeHost);
      });

    return p;
  }

  render() {
    const { config, editSuccessful, editFailed, editMessage } = this.state;

    if (config === null)
      return null;

    return (
      <div>
        <ConfigEditor config={config} onEdit={this.onEdit} isEditable={{true}} />

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

NodeConfigEditor.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
};

export default NodeConfigEditor;

