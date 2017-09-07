import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {AgGridReact} from 'ag-grid-react';
import { Button, Input } from 'reactstrap';

import Tabs from 'components/Tabs';
import AlertModal from 'components/AlertModal';
import { nextNumber, distanceToBottom } from 'classes/util';
import { timeout } from 'classes/util';

// ConfigEditor provides a view to edit configuration
// of a node, cluster
class ConfigEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      config: null, 

      selectedContext: null,

      editSuccessful: false,
      editFailed: false,
      editMessage: '',

      height: 200,
    };

    this.id = 'config_editor_' + nextNumber();

    this.fetchConfig = this.fetchConfig.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onContextTabSelect = this.onContextTabSelect.bind(this);
  }

  onContextTabSelect(context) {
    this.setState({
      selectedContext: context
    });
  }

  fetchConfig() {
    this.props.fetchConfig()
      .then((config) => {
        let { selectedContext } = this.state;
        if (selectedContext === null) {
          selectedContext = this.allContexts(config)[0];
        }

        this.setState({
          config: config,
          selectedContext: selectedContext,
        });
      })
      .catch((message) => {
        console.error(message);
      });
  }

  componentWillMount() {
    this.fetchConfig();
  }

  componentDidMount() {
    const elm = document.getElementById(this.id);
    let height = distanceToBottom(elm) - 30;

    this.setState({
      height: height,
    });
  }

  toNodeField(nodeHost) {
    return nodeHost.replace(/\./g, '_');
  }

  onEdit(nodeHost, configName, configValue) {
    const setState = (editSuccessful, editFailed, editMessage) => {
      this.setState({
        editSuccessful: editSuccessful,
        editFailed: editFailed,
        editMessage: editMessage
      });
    };

    this.props.onEdit(nodeHost, configName, configValue)
      .then((message) => {
        setState(true, false, message);

        timeout(() => setState(false, false, ''), 2000);
        this.fetchConfig();
      })
      .catch((message) => {
        setState(false, true, message);

        timeout(() => setState(false, false, ''), 2000);
      });
  }

  toColumnDefs(config) {
    // header
    const columnDefs = [{
      headerName: 'Config',
      field: 'name',
      width: 350,
      cellClass: 'as-grid-cell',
      pinned: 'left',
      cellStyle: {'font-weight': 'bold', 'font-size': '14px'},
    }];

    const {onEdit} = this.props;
    const isEditable = this.props.isEditable && typeof(onEdit) === 'function';

    const nodes = Object.keys(config);
    nodes.forEach((node) => {
      const ip = node.slice(0, node.indexOf(':'));

      columnDefs.push({
        headerName: ip,
        field: this.toNodeField(node), // ag-grid does not process key values with dots. Ex: 127.0.0.1
        cellClass: 'as-grid-cell',

        // referred to in onCellValueChanged
        nodeHost: node,

        // edit properties
        editable: isEditable,
        cellEditorFramework: CellEditor,
        onCellValueChanged: (p) => {
          const nodeHost = p.colDef.nodeHost;
          const config = p.data.name;
          const { newValue, oldValue } = p;

          if (newValue === oldValue)
            return;

          this.onEdit(nodeHost, config, newValue);
        }
      });
    });

    return columnDefs;
  }

  toRowData(config, context) {
    const nodes = Object.keys(config);
    const rowData = [];
    if (nodes.length > 0) {
      const node = Object.keys(config)[0];
      for (let c in config[node][context]) {
        const row = {
          name: c
        };

        for (let n in config) {
          const k = this.toNodeField(n);
          row[k] = config[n][context][c];
        }
        rowData.push(row);
      }
    }

    return rowData;
  }

  allContexts(config) {
    const nodes = Object.keys(config);
    const node = nodes[0];
    return Object.keys(config[node]);
  }

  currentContext(config) {
    const allContexts = this.allContexts(config);
    const context = this.state.selectedContext || allContexts[0];
    return context;
  }

  render() {
    const { config, height, editSuccessful, editFailed, editMessage } = this.state;

    let grid = null, allContexts = [];
    if (config) {
      allContexts = this.allContexts(config);
      const context = this.currentContext(config);
      const rowData = this.toRowData(config, context);
      const columnDefs = this.toColumnDefs(config);

      grid = <AgGridReact columnDefs={columnDefs} rowData={rowData} rowHeight="40" suppressScrollOnNewData enableColResize />;
    }

    return (
      <div>
        {allContexts.length > 1 &&
        <Tabs names={allContexts} selected={context} onSelect={this.onContextTabSelect}/>
        }

        <div className="ag-material" id={this.id} style={{height: height}}>
          {grid}
        </div>

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

ConfigEditor.PropTypes = {
  // (optional) callback to edit the configs
  // onEdit(nodeHost, configName, configValue)
  // should return a promise
  onEdit: PropTypes.func.isRequired,

  // callback to fetch the configs
  // fetchConfig() should return a promise
  // that returns success and failure message appropriately
  fetchConfig: PropTypes.func.isRequired,

  // can the configs be edited
  isEditable: PropTypes.bool.isRequired,
};

class CellEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value
    };

    this.onInputChange = this.onInputChange.bind(this);
  }

  onInputChange(evt) {
    let { value, name } = evt.target;

    if (typeof(name) === 'number') {
      // remove spurious non number character
      const c = value.slice(-1);
      if (c < '0' || c > '9')
        value = value.slice(0, -1);

      value = parseInt(value, 10);
    }

    this.setState({
      value: value,
    });
  }

  getValue() {
    return this.state.value;
  }

  render() {
    const { value } = this.state;
    
    if (value === 'true' || value === 'false' || typeof(value) === 'boolean') {
      return (
        <Input type="select" value={value} onChange={this.onInputChange}>
          <option value="true"> True </option>
          <option value="false"> False </option>
        </Input>
      );
    }

    if (typeof(value) === 'number') {
      return <Input type="number" onChange={this.onInputChange} value={value} />;
    }

    return <Input type="text" onChange={this.onInputChange} value={value} />;
  }
}

export default ConfigEditor;

