import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {AgGridReact} from 'ag-grid-react';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';

import EditConfigModal from 'components/EditConfigModal';
import Tabs from 'components/Tabs';

// ConfigEditor provides a view to edit configuration
// of a node, cluster
class ConfigEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedContext: null,
      selectedConfigs: [],

      showEdit: false,
      edit: {
        inProgress: false,
        errorMessage: '',
        success: false,
      }
    };

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
  
    let i = configs.findIndex((d) => d.name === data.name && d.value === data.value);
    if (i >= 0)
      configs.splice(i, 1);
    else
      configs.push(data);

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
      showEdit: true
    });
  }

  onHideEdit() {
    this.setState({
      showEdit: false
    });
  }

  render() {
    const columnDefs = [{
      headerName: 'Config',
      field: 'name',
      checkboxSelection: (row) => {
        // TODO
        return true || row.data.isEditable;
      }
    }, {
      headerName: 'Value',
      field: 'value'
    }];
   
    const {config} = this.props;
    const contexts = Object.keys(config);
    const selected = this.state.selectedContext || contexts[0];
    const rowData = config[selected] || [];
    const {showEdit, edit, selectedConfigs} = this.state;

    return (
      <div>
        {contexts.length > 1 &&
        <Tabs names={contexts} default={selected} onSelect={this.onContextTabSelect}/>
        }

        <div className="ag-bootstrap" style={{height: 400}}>
          <AgGridReact columnDefs={columnDefs} rowData={rowData} 
            onRowSelected={this.onRowSelected} rowSelection="multiple" />

          <Button style={{marginTop: 20}} disabled={selectedConfigs.length === 0} color="primary" onClick={this.onShowEdit}> Edit </Button>
        </div>

        {showEdit &&
         <EditConfigModal config={selectedConfigs} inProgress={edit.inProgress} errorMessage={edit.errorMessage}
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
  // callback to edit the configs
  // onEdit(configs)
  onEdit: PropTypes.func.isRequired,

  config: function(props, propName, componentName) {
    let isValid = true;
    for (let k in props) {
      let context = props[k];
      context.forEach((c) => {
        if (typeof(c.name) !== 'string')
          isValid = false;

        const vt = typeof(c.value);
        if (vt === 'undefined' || (vt !== 'string' && vt !== 'number'))
          isValid = false;

        // c.isEditable is a boolean 
      });
    }

    if (!isValid) {
      return new Error('Invalid prop `' + propName + '` supplied to' 
          + ' `' + componentName + '`. Validation failed.');
    }
  }
};

export default ConfigEditor;

