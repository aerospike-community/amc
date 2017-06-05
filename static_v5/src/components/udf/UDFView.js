import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import brace from 'brace';
import AceEditor from 'react-ace';
import 'brace/mode/lua';
import 'brace/theme/github';

import { getUDF, deleteUDF } from 'api/udf';
import { nextNumber, distanceToBottom } from 'classes/util';
import Spinner from 'components/Spinner';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class UDFView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: false,
      sourceCode: '',
      udfType: '',

      editorHeight: 500,

      deleteShowConfirm: false,
      deleteInProgress: false,
      deleteSuccessfull: null,
      deleteErrorMsg: '',
    };

    this.id = 'udf_editor' + nextNumber();

    this.onEdit = this.onEdit.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onShowConfirm = this.onShowConfirm.bind(this);
    this.onDeleteUDF = this.onDeleteUDF.bind(this);
  }

  componentDidMount() {
    const editor = document.getElementById(this.id);
    const height = distanceToBottom(editor);
    this.setState({
      editorHeight: height - 80
    });

    const { clusterID, udfName } = this.props;
    this.fetchUDF(clusterID, udfName);
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID, udfName } = nextProps;

    if (this.props.clusterID === clusterID 
        && this.props.udfName === udfName)
      return;

    this.fetchUDF(clusterID, udfName);
  }

  fetchUDF(clusterID, udfName) {
    this.setState({
      isFetching: true
    });

    getUDF(clusterID, udfName)
      .then((udf) => {
        this.setState({
          isFetching: false,
          sourceCode: udf.source,
          udfType: udf.type
        });
      });
  }

  onEdit() {
    this.props.onEditUDF();
  }

  onShowConfirm() {
    this.setState({
      deleteShowConfirm: true,
    });
  }

  onCancel() {
    this.props.onCancel();
  }

  onDeleteUDF() {
    const { clusterID, udfName } = this.props;
    this.setState({
      deleteInProgress: true
    });
    deleteUDF(clusterID, udfName)
      .then(() => {
        this.setState({
          deleteInProgress: false,
          deleteSuccessfull: true
        });
        window.setTimeout(() => this.onCancel(), 2000);
      })
      .catch((msg) => {
        this.setState({
          deleteInProgress: false,
          deleteSuccessfull: false,
          deleteErrorMsg: msg || 'Failed to delete UDF'
        });
      });
  }

  renderDeleteModal() {
    const { deleteShowConfirm, deleteInProgress, deleteSuccessfull, deleteErrorMsg } = this.state;

    const onCancelModal = () => {
      this.setState({
        deleteShowConfirm: false
      });
    };

    if (!deleteShowConfirm)
      return null;

    const disabled = deleteInProgress || deleteSuccessfull;
    if (!deleteInProgress && deleteSuccessfull === true) {
      return (
        <Modal isOpen={true} toggle={() => {}}>
          <ModalHeader> Success </ModalHeader>
          <ModalBody> Successfully deleted {this.props.udfName} </ModalBody>
        </Modal>
      );
    }

    return (
      <Modal isOpen={true} toggle={() => {}}>
        <ModalHeader> Confirm </ModalHeader>
        <ModalBody>  Delete {this.props.udfName} ?  </ModalBody>
        <ModalFooter>
          {!deleteInProgress && deleteSuccessfull === false &&
            errorMsg}
          {deleteInProgress &&
           <span> <Spinner /> Deleting ... </span>}
          <Button disabled={disabled} color="primary" onClick={this.onDeleteUDF}>Confirm</Button>
          <Button disabled={disabled} color="secondary" onClick={onCancelModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  render() {
    if (this.state.isFetching) 
      return <div> <Spinner /> Loading ... </div>;

    const editorHeight = this.state.editorHeight + 'px';
    return (
      <div>
        {this.renderDeleteModal()}

        <div className="as-centerpane-header"> 
          {this.props.udfName} 
        </div>
        <div className="as-ace-editor">
          <AceEditor width={'100%'} height={editorHeight} mode="lua" readOnly={true} theme="github" name={this.id} value={this.state.sourceCode} />
        </div>
        <div>
          <Button color="primary" size="sm" onClick={this.onEdit}> Edit </Button>
          <Button style={{marginLeft: 10}} color="danger" size="sm" onClick={this.onShowConfirm}> Delete </Button>
          <Button style={{marginLeft: 10}} color="secondary" size="sm" onClick={this.onCancel}> Cancel </Button>
        </div>
      </div>
    );
  }
}

UDFView.PropTypes = {
  clusterID: PropTypes.string,
  udfName: PropTypes.string,
  // callback to edit the currently viewing udf
  // onEditUDF()
  onEditUDF: PropTypes.func,
  // callback to cancel the view
  // onCancel()
  onCancel: PropTypes.func,
};

export default UDFView;

