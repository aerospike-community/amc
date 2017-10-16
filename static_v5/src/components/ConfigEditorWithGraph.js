import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';

import ConfigEditor from 'components/ConfigEditor';
import ConfigChart from 'components/ConfigChart';
import { getConfig, setConfig } from 'api/node';
import { timeout } from 'classes/util';

function toKey(nodeHost, config) {
  config = config.replace(/-/g, '_');
  nodeHost = nodeHost.replace(/:/g, '');
  nodeHost = nodeHost.replace(/\./g, '');
  return nodeHost + '_' + config;
}

// ConfigEditorWithGraph shows the configurations of a node
class ConfigEditorWithGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: true,  // to redraw the config
      chartedConfigs: [], // array of node properties
      showGraph: false,
    };

    this.getConfig = this.getConfig.bind(this);
    this.onCellClicked = this.onCellClicked.bind(this);
    this.onHideGraph = this.onHideGraph.bind(this);
  }

  toName(nodeHost, config) {
    if (this.props.multipleNodes)
      return nodeHost + ': ' + config;
    else
      return config;
  }

  getConfig() {
    const all = {}; // all[nodeHost_property] = value
    return this.props.fetchConfig()
      .then((configs) => {
        let node, p;
        for (node in configs) {
          const c = configs[node].all;
          for (p in c) {
            const k = toKey(node, p);
            all[k] = c[p];
          }
        }

        return all;
      });
  }
     
  onHideGraph() {
    this.setState({
      showGraph: false
    });
  }

  onCellClicked(nodeHost, configName, value) {
    if (typeof(value) !== 'number')
      return;

    const config = this.state.chartedConfigs.slice(); // copy
    const key = toKey(nodeHost, configName);

    if (config.findIndex((c) => c.key === key) === -1) {
      config.push({
        key: key,
        name: this.toName(nodeHost, configName),
      });

      this.setState({
        chartedConfigs: config,
        showGraph: true,
      });
    } else {
      this.setState({
        showGraph: true,
      });
    }
  }

  render() {
    const { show, chartedConfigs, showGraph } = this.state;
    const style = { height: 25 };
    
    if (show === null)
      return null;

    return (
      <div>
        {showGraph &&
          <div>
            <div style={style}>
              <a className="pull-right as-link" onClick={this.onHideGraph}> Close </a>
            </div>

            <ConfigChart getConfig={this.getConfig} configs={chartedConfigs} />
          </div>
        }

        <ConfigEditor 
            isEditable={true} 
            fetchConfig={this.props.fetchConfig} onEdit={this.props.onEdit} 
            onCellClicked={this.onCellClicked} />
      </div>
    );
  }
}

ConfigEditorWithGraph.PropTypes = {
  // (optional) callback to edit the configs
  // onEdit(nodeHost, configName, configValue)
  // should return a promise
  onEdit: PropTypes.func.isRequired,

  // are the configs on multiple values
  multipleNodes: PropTypes.bool,

  // callback to fetch the configs
  // fetchConfig() should return a promise
  // that returns success and failure message appropriately
  fetchConfig: PropTypes.func.isRequired,

  // can the configs be edited
  isEditable: PropTypes.bool.isRequired,
};

export default ConfigEditorWithGraph;


