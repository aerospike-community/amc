import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/lua';
import 'brace/theme/github';

import { getUDF, saveUDF } from 'api/udf';
import { nextNumber, distanceToBottom } from 'classes/util';
import { timeout } from 'classes/util';
import AlertModal from 'components/AlertModal';
import Spinner from 'components/Spinner';

import { Button, Form, FormGroup, Label, Input } from 'reactstrap';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class UDFCreate extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isUpdating: false,
      sourceCode: '',
      udfName: '',
      hasErrors: false, // does the source code have errors
      success: false, // udf created successfully

      editorHeight: 500,
    };

    this.id = 'udf_editor' + nextNumber();
    this.editor; // the ace editor instance

    this.onNameChange = this.onNameChange.bind(this);
    this.onCreate = this.onCreate.bind(this);
    this.onEditorLoad = this.onEditorLoad.bind(this);
    this.onEditorChange = this.onEditorChange.bind(this);
  }

  onEditorLoad(editor) {
    this.editor = editor;
  }

  hasErrors() {
    const annotations = this.editor.getSession().getAnnotations();
    const hasErrors = annotations.find((a) => a.type === 'error');
    if (hasErrors || this.state.udfName.length === 0)
      return true;
    return false;
  }

  onEditorChange(value, evt) {
    this.setState({
      sourceCode: value,
      hasErrors: this.hasErrors(),
    });
  }

  onCreate() {
    if (this.state.hasErrors)
      return;

    this.setState({
      isUpdating: true
    });

    const { clusterID } = this.props;
    const { sourceCode, udfName } = this.state;
    saveUDF(clusterID, udfName, sourceCode)
      .then((udf) => {
        this.setState({
          isUpdating: false,
          success: true,
        });

        timeout(() => {
          this.props.onCreateSuccess(udf.name, udf.source, udf.type);
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

  onNameChange(evt) {
    this.setState({
      udfName: evt.target.value
    });
  }

  componentDidMount() {
    const editor = document.getElementById(this.id);
    const height = distanceToBottom(editor);
    this.setState({
      editorHeight: height - 120
    });
  }

  render() {
    const { hasErrors, isUpdating, success } = this.state;
    const editorHeight = this.state.editorHeight + 'px';

    const msg = `Successfully created ${this.state.udfName}`;
    return (
      <div>
        {success && 
          <AlertModal header="Success" message={msg} type="success" />
        }

        <div className="row">
          <div className="col-xl-12 as-section-header"> 
            Create UDF
          </div>
        </div>
        <Form>
          <FormGroup>
            <Label> UDF Name </Label>
            <Input required type="text" name="udfName" onChange={this.onNameChange} value={this.state.udfName}
                    placeholder="UDF Name" disabled={this.isUpdating} />
          </FormGroup>

          <div className="as-ace-editor">
            <AceEditor width={'100%'} height={editorHeight} fontSize={16}
              mode="lua" theme="github" 
              name={this.id} value={this.state.sourceCode} readOnly={this.state.isUpdating}
              onLoad={this.onEditorLoad} onChange={this.onEditorChange}/>
          </div>
          <div>
            <Button disabled={hasErrors} color="primary" size="sm" onClick={this.onCreate}> Add </Button>
            {isUpdating && 
            <Spinner />}
          </div>
        </Form>
      </div>
    );
  }
}

UDFCreate.PropTypes = {
  clusterID: PropTypes.string,
  udfName: PropTypes.string,
  // callback when the udf is created successfully
  // onUDFCreateSuccess(udfName, udfSource, udfType)
  onUDFCreateSuccess: PropTypes.func,
};

export default UDFCreate;



