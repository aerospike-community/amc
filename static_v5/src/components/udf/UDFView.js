import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import brace from 'brace';
import AceEditor from 'react-ace';
import 'brace/mode/lua';
import 'brace/theme/github';

import { VIEW_TYPE } from 'classes/constants';
import { isPermissibleAction, UDF_ACTIONS } from 'classes/entityActions';

import { getUDF, deleteUDF, saveUDF } from 'api/udf';
import { nextNumber, distanceToBottom } from 'classes/util';
import Spinner from 'components/Spinner';
import UDFDeleteModal from 'components/udf/UDFDeleteModal';
import AlertModal from 'components/AlertModal';
import { whenClusterHasCredentials } from 'classes/security';
import { timeout, cancelTimeout } from 'classes/util';

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

      canEdit: false,
      canDelete: false,

      // edit
      hasErrors: false, // does the source code have errors
      hasChanged: false, // has the source code changed
      showUpdateSuccess: false,
    };

    this.id = 'udf_editor' + nextNumber();
    this.editor; // the ace editor instance

    this.timeoutid;

    // delete methods
    this.onDeleteSuccess = this.onDeleteSuccess.bind(this);
    this.onShowDeleteModal = this.onShowDeleteModal.bind(this);
    this.onHideDeleteModal = this.onHideDeleteModal.bind(this);

    // edit methods
    this.onUpdate = this.onUpdate.bind(this);
    this.onEditorLoad = this.onEditorLoad.bind(this);
    this.onEditorChange = this.onEditorChange.bind(this);
  }

  setPermissions(clusterID) {
    this.setState({
      canEdit: false,
      canDelete: false,
    });

    whenClusterHasCredentials(clusterID, () => {
      const canEdit = isPermissibleAction(UDF_ACTIONS.Edit, clusterID, VIEW_TYPE.UDF);
      const canDelete = isPermissibleAction(UDF_ACTIONS.Delete, clusterID, VIEW_TYPE.UDF);

      this.setState({
        canEdit: canEdit,
        canDelete: canDelete
      });
    });
  }

  componentWillUnmount() {
    const id = this.timeoutid;
    if (id)
      cancelTimeout(id);
  }

  pollErrors() {
    const interval = 50; 
    const fn = () => {
      this.setState({
        hasErrors: this.hasErrors(),
      });

      this.timeoutid = timeout(fn, interval);
    };

    this.timeoutid = timeout(fn, interval);
  }

  hasErrors() {
    let hasErrors = false;
    if (this.editor) {
      const annotations = this.editor.getSession().getAnnotations();
      hasErrors = annotations.find((a) => a.type === 'error');
    }

    return hasErrors;
  }

  componentDidMount() {
    const editor = document.getElementById(this.id);
    const height = distanceToBottom(editor);
    this.setState({
      editorHeight: height - 80
    });

    const { clusterID, udfName } = this.props;
    this.fetchUDF(clusterID, udfName);
    this.setPermissions(clusterID);

    this.pollErrors();
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID, udfName } = nextProps;

    if (this.props.clusterID === clusterID 
        && this.props.udfName === udfName)
      return;

    this.setState({
      hasChanged: false
    });
    this.setPermissions(clusterID);
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

    this.setState({
      hasChanged: true,
      sourceCode: value,
    });
  }

  onUpdate() {
    if (!this.state.hasChanged || this.hasErrors())
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

        timeout(() => {
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
    const { canEdit, canDelete } = this.state;
    const readOnly = isUpdating || !canEdit;

    return (
      <div>
        <div className="row" style={{marginBottom: 10}}>
          <div className="col-xl-12 as-section-header">
            {`UDF - ${udfName}`} 

            {canDelete &&
            <Button className="float-right" disabled={isUpdating} 
                color="danger" size="sm" onClick={this.onShowDeleteModal}> 
              <i className="fa fa-trash"></i>
              Delete 
            </Button>}

            {canEdit &&
            <Button className="float-right" disabled={!hasChanged || hasErrors || isUpdating} 
                color="primary" size="sm" onClick={this.onUpdate}> 
              <i className="fa fa-floppy-o"></i>
              Update 
            </Button>}
          </div>
        </div>

        <div className="as-ace-editor">
          <AceEditor width={'100%'} height={editorHeight} fontSize={16}
            mode="lua" theme="github" 
            name={this.id} value={sourceCode} readOnly={readOnly} 
            onLoad={this.onEditorLoad} onChange={this.onEditorChange}/>
        </div>
        
        {showDeleteModal &&
        <UDFDeleteModal clusterID={clusterID} udfName={udfName} onDeleteSuccess={this.onDeleteSuccess} onCancel={this.onHideDeleteModal}/>
        }

        {showUpdateSuccess &&
        <AlertModal header="Success" message={`Successfully updated ${udfName}`} type="success" />
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

