import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {AgGridReact} from 'ag-grid-react';
import { Button, Input } from 'reactstrap';

import Tabs from 'components/Tabs';
import { nextNumber, distanceToBottom } from 'classes/util';

// ConfigEditor provides a view to edit configuration
// of a node, cluster
class ConfigEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedContext: null,

      height: 200,
      showEdit: false,
    };

    this.id = 'config_editor_' + nextNumber();

    this.onContextTabSelect = this.onContextTabSelect.bind(this);
  }

  onContextTabSelect(context) {
    this.setState({
      selectedContext: context
    });
  }

  componentDidMount() {
    const elm = document.getElementById(this.id);
    let h = distanceToBottom(elm) - 20;

    if (this.props.isEditable)
      h -= 80; // space for buttons

    this.setState({
      height: h,
      selectedContext: this.allContexts()[0],
    });
  }

  toNodeField(nodeHost) {
    return nodeHost.replace(/\./g, '_');
  }

  toColumnDefs() {
    // header
    const columnDefs = [{
      headerName: 'Config',
      field: 'name',
      width: 280,
      cellClass: 'as-grid-cell',
      pinned: 'left',
      cellStyle: {background: '#eee'},
    }];

    const {config, onEdit} = this.props;
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

          onEdit(nodeHost, config, newValue);
        }
      });
    });

    return columnDefs;
  }

  toRowData(context) {
    const {config} = this.props;

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

  allContexts() {
    const {config} = this.props;
    const nodes = Object.keys(config);
    const node = nodes[0];
    return Object.keys(config[node]);
  }

  currentContext() {
    const allContexts = this.allContexts();
    const context = this.state.selectedContext || allContexts[0];
    return context;
  }

  render() {
    const {height} = this.state;

    const allContexts = this.allContexts();
    const context = this.currentContext();
    const rowData = this.toRowData(context);
    const columnDefs = this.toColumnDefs();

    return (
      <div>
        {allContexts.length > 1 &&
        <Tabs names={allContexts} selected={context} onSelect={this.onContextTabSelect}/>
        }

        <div className="ag-material" id={this.id} style={{height: height}}>
          <AgGridReact columnDefs={columnDefs} rowData={rowData} rowHeight="40" suppressScrollOnNewData enableColResize />
        </div>
      </div>
    );
  }
}

ConfigEditor.PropTypes = {
  // (optional) callback to edit the configs
  // onEdit(nodeHost, configName, configValue)
  onEdit: PropTypes.func.isRequired,

  // can the configs be edited
  isEditable: PropTypes.bool.isRequired,

  // {
  //  'nodeHost': {
  //    'context_1': {
  //      'config': value,
  //      ...
  //    },
  //    ...
  //  },
  //  ...
  // }
  config: PropTypes.object,
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

