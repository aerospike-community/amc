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
      config: {}
    };

    this.onEdit = this.onEdit.bind(this);
  }

  fetchConfig(clusterID, nodeHost) {
    // TODO process config according to context
    // TODO set the isEdit flag
    const processConfig = (config) => {
      let all = [];
      for (let k in config) {
        all.push({
          name: k,
          value: config[k]
        });
      }
      return all;
    };

    getConfig(clusterID, nodeHost)
      .then((response) => {
        const all = processConfig(response.config);
        this.setState({
          config: {
            all: all,
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
    const p = setConfig(clusterID, nodeHost, config)
              .then((response) => {
                this.fetchConfig(clusterID, nodeHost);
                return response;
              });
    return p;
  }

  render() {
    const { config } = this.state;
    return (
        <ConfigEditor config={config} onEdit={this.onEdit}/>
    );
  }
}

NodeConfigEditor.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
};

export default NodeConfigEditor;

