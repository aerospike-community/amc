import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/lua';
import 'brace/theme/github';

import Spinner from 'components/Spinner';
import { getUDF, saveUDF } from 'api/udf';
import { nextNumber } from 'classes/util';

import { Button } from 'reactstrap';

class UDFView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: false,
      isUpdating: false,
      sourceCode: '',

      hasErrors: false, // does the source code have errors
      hasChanged: false, // has the source code changed
    };

    this.id = 'udf_editor' + nextNumber();
    this.editor; // the ace editor instance

    this.onView = this.onView.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.onEditorLoad = this.onEditorLoad.bind(this);
    this.onEditorChange = this.onEditorChange.bind(this);
  }

	componentDidMount() {
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
        });
      });
  }

  onView() {
    this.props.onViewUDF();
  }

  onEditorLoad(editor) {
    this.editor = editor;
  }

  hasErrors() {
    const annotations = this.editor.getSession().getAnnotations();
    const hasErrors = annotations.find((a) => a.type === 'error');
    return hasErrors;
  }

  onEditorChange(value, evt) {
    this.setState({
      hasChanged: true,
      sourceCode: value,
      hasErrors: this.hasErrors(),
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
          isUpdating: false
        });
        this.props.onViewUDF();
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

    const { hasErrors, hasChanged, isUpdating } = this.state;
    return (
      <div>
        <h4> Edit {this.props.udfName} </h4>
        <div className="as-ace-editor">
          <AceEditor width={'100%'} mode="lua" theme="github" name={this.id} value={this.state.sourceCode} readOnly={this.state.isUpdating}
            onLoad={this.onEditorLoad} onChange={this.onEditorChange}/>
        </div>
        <div>
          {isUpdating && 
           <span> Updating ... </span>}
          <Button disabled={!hasChanged || hasErrors} color="primary" size="sm" onClick={this.onUpdate}> Update </Button>
          <Button size="sm" onClick={this.onView}> Cancel </Button>
        </div>
      </div>
    );
  }
}

UDFView.PropTypes = {
  clusterID: PropTypes.string,
  udfName: PropTypes.string,
  // callback to view the currently editing UDF
  // onViewUDF()
  onViewUDF: PropTypes.func,
};

export default UDFView;


