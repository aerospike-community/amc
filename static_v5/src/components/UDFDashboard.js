
import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/lua';
import 'brace/theme/github';

import 'bootstrap/dist/css/bootstrap.css';

import { getUDF } from '../api/udf';
import { nextNumber } from '../classes/util';

class UDFDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: true,
      sourceCode: '',
      udfType: '',
    };

    this.id = 'lua_editor' + nextNumber();
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

  render() {
    let contents = <div>  Loading ... </div>;
    if (!this.state.isFetching) {
      contents = (
        <div>
          <AceEditor mode="lua" theme="github" readOnly={true} name={this.id} value={this.state.sourceCode}/>
        </div>
      );
    }
    return (
      <div>
        {this.props.udfName}
        {contents}
      </div>
    );
  }
}

UDFDashboard.PropTypes = {
  clusterID: PropTypes.string,
  udfName: PropTypes.string
};

export default UDFDashboard;
