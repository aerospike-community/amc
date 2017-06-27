import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ConfigEditor from 'components/ConfigEditor';
import { getConfig, setConfig } from 'api/node';

// NodeConfigEditor shows the configurations of a node
class NodeConfigEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      config: null,
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

  onEdit(config) {
    const { clusterID, nodeHost }  = this.props;
    const p = setConfig(clusterID, nodeHost, config);
    p.then((response) => {
      // redraw config editor component
      this.setState({
        config: null
      });

      this.fetchConfig(clusterID, nodeHost);
      return response;
    });

    return p;
  }

  render() {
    const { config } = this.state;

    if (config === null)
      return null;

    return (
        <ConfigEditor config={config} onEdit={this.onEdit} isEditable="true"/>
    );
  }
}

NodeConfigEditor.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
};

export default NodeConfigEditor;

