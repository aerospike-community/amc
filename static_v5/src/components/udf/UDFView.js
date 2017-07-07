import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import brace from 'brace';
import AceEditor from 'react-ace';
import 'brace/mode/lua';
import 'brace/theme/github';

import { getUDF, deleteUDF, saveUDF } from 'api/udf';
import { nextNumber, distanceToBottom } from 'classes/util';
import Spinner from 'components/Spinner';
import UDFDeleteModal from 'components/udf/UDFDeleteModal';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class UDFView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: false,
      sourceCode: '',
      udfType: '',

      editorHeight: 500,

      // delete
      showDeleteModal: false,

      // edit
      hasErrors: false, // does the source code have errors
      hasChanged: false, // has the source code changed
      showUpdateSuccess: false,
    };

    this.id = 'udf_editor' + nextNumber();
    this.editor; // the ace editor instance

    // delete methods
    this.onDeleteSuccess = this.onDeleteSuccess.bind(this);
    this.onShowDeleteModal = this.onShowDeleteModal.bind(this);
    this.onHideDeleteModal = this.onHideDeleteModal.bind(this);

    // edit methods
    this.onUpdate = this.onUpdate.bind(this);
    this.onEditorLoad = this.onEditorLoad.bind(this);
    this.onEditorChange = this.onEditorChange.bind(this);
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

  onShowDeleteModal() {
    this.setState({
      showDeleteModal: true,
    });
  }

  onHideDeleteModal() {
    this.setState({
      showDeleteModal: false,
    });
  }

  onDeleteSuccess() {
    const { clusterID, udfName } = this.props;
    this.props.onDeleteSuccess(clusterID, udfName);
  }

  onEditorLoad(editor) {
    this.editor = editor;
  }

  onEditorChange(value, evt) {
    const annotations = this.editor.getSession().getAnnotations();
    const hasErrors = annotations.find((a) => a.type === 'error');

    this.setState({
      hasChanged: true,
      sourceCode: value,
      hasErrors: hasErrors,
    });
  }

  onUpdate() {
    if (!this.state.hasChanged || this.state.hasErrors)
      return;

    this.setState({
      isUpdating: true
    });

    const { clusterID, udfName } = this.props;
    const { sourceCode } = this.state;
    saveUDF(clusterID, udfName, sourceCode)
      .then(() => {
        this.setState({
          isUpdating: false,
          showUpdateSuccess: true,
        });

        window.setTimeout(() => {
          this.setState({
            showUpdateSuccess: false
          });
        }, 2000);
      })
      .catch((err) => {
        // TODO inject errors into the editor annotations
        console.log(err);
        this.setState({
          isUpdating: false
        });
      });
  }

  render() {
    if (this.state.isFetching) 
      return <div> <Spinner /> Loading ... </div>;

    const editorHeight = this.state.editorHeight + 'px';
    const { clusterID, udfName } = this.props;
    const { showDeleteModal, showUpdateSuccess, hasErrors, hasChanged, isUpdating, sourceCode } = this.state;

    return (
      <div>
        <div className="row" style={{marginBottom: 10}}>
          <div className="col-xl-12 as-section-header">
            {`UDF - ${udfName}`} 

            <Button disabled={!hasChanged || hasErrors || isUpdating} color="primary" size="sm" onClick={this.onUpdate}> Update </Button>
            <Button disabled={isUpdating} color="danger" size="sm" onClick={this.onShowDeleteModal}> Delete </Button>
          </div>
        </div>

        <div className="as-ace-editor">
          <AceEditor width={'100%'} height={editorHeight} mode="lua" theme="github" 
            name={this.id} value={sourceCode} readOnly={isUpdating} 
            onLoad={this.onEditorLoad} onChange={this.onEditorChange}/>
        </div>
        
        {showDeleteModal &&
        <UDFDeleteModal clusterID={clusterID} udfName={udfName} onDeleteSuccess={this.onDeleteSuccess} onCancel={this.onHideDeleteModal}/>
        }

        {showUpdateSuccess &&
        <Modal isOpen={true} toggle={() => {}}>
          <ModalHeader> Success </ModalHeader>
          <ModalBody> Successfully updated {udfName} </ModalBody>
        </Modal>
        }

        {isUpdating &&
        <Modal isOpen={true} toggle={() => {}}>
          <ModalHeader> Updating {udfName} </ModalHeader>
          <ModalBody> Updating ... <Spinner size="1"/> </ModalBody>
        </Modal>
        }

      </div>
    );
  }
}

UDFView.PropTypes = {
  clusterID: PropTypes.string,
  udfName: PropTypes.string,

  // callback on successfull delete
  // onDeleteSuccess(clusterID, udfName)
  onDeleteSuccess: PropTypes.func,
};

export default UDFView;

