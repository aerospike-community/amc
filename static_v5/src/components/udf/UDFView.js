import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/lua';
import 'brace/theme/github';

import 'bootstrap/dist/css/bootstrap.css';

import { getUDF } from '../../api/udf';
import { nextNumber } from '../../classes/util';

import { Button } from 'reactstrap';

class UDFView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: false,
      sourceCode: '',
      udfType: '',
    };

    this.id = 'udf_editor' + nextNumber();
    this.onEdit = this.onEdit.bind(this);
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
          udfType: udf.type
        });
      });
  }

  onEdit() {
    this.props.onEditUDF();
  }

  render() {
    if (this.state.isFetching) 
      return <div> Loading ... </div>;

    return (
      <div>
        <h4> {this.props.udfName} </h4>
        <div className="as-ace-editor">
          <AceEditor width={'100%'} mode="lua" readOnly={true} theme="github" name={this.id} value={this.state.sourceCode} />
        </div>
        <div>
          <Button color="primary" size="sm" onClick={this.onEdit}> Edit </Button>
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
};

export default UDFView;

