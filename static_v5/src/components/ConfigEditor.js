import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {AgGridReact} from 'ag-grid-react';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';

import EditConfigModal from 'components/EditConfigModal';
import Tabs from 'components/Tabs';
import { nextNumber, distanceToBottom } from 'classes/util';

// ConfigEditor provides a view to edit configuration
// of a node, cluster
class ConfigEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedContext: null,
      selectedConfigs: [],

      height: 200,
      showEdit: false,
      edit: {
        inProgress: false,
        errorMessage: '',
        success: false,
      }
    };

    this.id = 'config_editor_' + nextNumber();

    this.rowData = []; // row data for the grid
    this.context = null; // context

    this.onContextTabSelect = this.onContextTabSelect.bind(this);
    this.onRowSelected = this.onRowSelected.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onShowEdit = this.onShowEdit.bind(this);
    this.onHideEdit = this.onHideEdit.bind(this);
  }

  onContextTabSelect(context) {
    this.setState({
      selectedContext: context
    });
  }

  onRowSelected(row) {
    const data = row.node.data;
    const configs = this.state.selectedConfigs.slice(); // copy
  
    let i = configs.findIndex((d) => d === data.name);
    if (i >= 0) // already present. Remove.
      configs.splice(i, 1);
    else // add
      configs.push(data.name);

    this.setState({
      selectedConfigs: configs
    });
  }

  onEdit(config) {
    const edits = {};
    config.forEach((c) => {
      edits[c.name] = '' + c.value
    });

    this.props.onEdit(edits)
      .then(() => {
        setEdit();
        window.setTimeout(() => {
          setEdit('', false);
        }, 2000);
      })
      .catch((message) => {
        setEdit(message, false);
      });

    var setEdit = (message = '', success = true)  => {
      this.setState({
        showEdit: false,
        selectedConfigs: [],
        edit: {
          inProgress: false,
          errorMessage: message,
          success: success,
        }
      });
    };
  }

  onShowEdit() {
    this.setState({
      showEdit: true,
    });
  }

  // return node configs for the first node
  configsOfSingleNode() {
    const {selectedConfigs} = this.state;
    const {config} = this.props;
    const node = Object.keys(config)[0];
    const context = this.currentContext();

    var edit = [];
    selectedConfigs.forEach((c) => {
      edit.push({
        name: c,
        value: config[node][context][c]
      });
    });

    return edit;
  }

  onHideEdit() {
    this.setState({
      showEdit: false
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
    const ip = nodeHost.slice(0, nodeHost.indexOf(':'));
    return ip.replace(/\./g, '_');
  }

  toColumnDefs() {
    const {config} = this.props;
    const isEditable = this.isEditable();
    const columnDefs = [{
      headerName: 'Config',
      field: 'name',
      width: 250,
      checkboxSelection: (row) => isEditable
    }];

    const nodes = Object.keys(config);
    nodes.forEach((node) => {
      const ip = node.slice(0, node.indexOf(':'));
      columnDefs.push({
        headerName: ip,
        field: this.toNodeField(node), // ag-grid does not process key values with dots. Ex: 127.0.0.1
      });
    });

    return columnDefs;
  }

  toRowData(context) {
    // return same data, needed for 'checkbox' selection to work
    // on ag-grid
    if (this.context === context)
      return this.rowData;

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

    this.context = context;
    this.rowData = rowData;
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

  isEditable() {
    let {isEditable, config} = this.props;
    if (Object.keys(config).length > 1)
      return false;

    return isEditable;
  }

  render() {
    const {showEdit, edit, selectedConfigs, height} = this.state;

    const allContexts = this.allContexts();
    const context = this.currentContext();
    const rowData = this.toRowData(context);
    const columnDefs = this.toColumnDefs();
    const isEditable = this.isEditable();
    const nodeConfigs = this.configsOfSingleNode();

    return (
      <div>
        {allContexts.length > 1 &&
        <Tabs names={allContexts} selected={context} onSelect={this.onContextTabSelect}/>
        }

        <div className="ag-material" id={this.id} style={{height: height}}>
          <AgGridReact columnDefs={columnDefs} rowData={rowData} rowHeight="50"
            onRowSelected={this.onRowSelected} rowSelection="multiple" />

          {isEditable &&
          <Button style={{marginTop: 20}} disabled={selectedConfigs.length === 0} color="primary" onClick={this.onShowEdit}> Edit </Button>
          }
        </div>

        {showEdit &&
         <EditConfigModal config={nodeConfigs} inProgress={edit.inProgress} errorMessage={edit.errorMessage}
          onEdit={this.onEdit} onCancel={this.onHideEdit} />
        }

        {edit.success &&
          <Modal isOpen={true} toggle={() => {}}>
            <ModalHeader> Success </ModalHeader>
            <ModalBody> Successfully edited config </ModalBody>
          </Modal>
        }

      </div>
    );
  }
}

ConfigEditor.PropTypes = {
  // Edit works only for a single node
  //
  // callback to edit the configs
  // onEdit(configs)
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

export default ConfigEditor;

