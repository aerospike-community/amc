import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { createIndex } from 'api/index';
import { timeout } from 'classes/util';
import AlertModal from 'components/AlertModal';
import Spinner from 'components/Spinner';

import { Button, Form, FormGroup, FormFeedback, Label, Input } from 'reactstrap';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const BinTypes = {
  string: 'string',
  numeric: 'numeric'
};

class IndexCreate extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      namespaceName: '',
      setName: '',
      indexName: '',
      binName: '',
      binType: BinTypes.string,

      showWarnings: false,
      showError: false,
      isUpdating: false,
      success: false, // index created successfully
      errMsg: false,
    };

    this.onInputChange = this.onInputChange.bind(this);
    this.onCreate = this.onCreate.bind(this);
  }

  isFormValid() {
    const { namespaceName, setName, indexName, binName, binType } = this.state;
    if (!namespaceName || !setName || !indexName || !binName || !binType)
      return false;

    return true;
  }

  onInputChange(evt) {
    const { name, value } = evt.target;
    const { namespaceName } = this.state;

    if (name === 'namespaceName') {
      if (namespaceName === value) 
        return;

      this.setState({
        namespaceName: value,
        setName: '',
      });
    } else {
      this.setState({
        [name]: value
      });
    }
  }

  onCreate() {
    if (!this.isFormValid()) {
      this.setState({
        showWarnings: true
      });
      return;
    }

    this.setState({
      isUpdating: true
    });

    const { clusterID } = this.props;
    const { namespaceName, setName, indexName, binName, binType } = this.state;
    const isNumeric = binType === BinTypes.numeric;

    createIndex(clusterID, indexName, namespaceName, setName, binName, isNumeric)
      .then(() => {
        this.setState({
          isUpdating: false,
          success: true,
          showError: false,
        });

        timeout(() => {
          this.props.onCreateIndexSuccess(clusterID, indexName);
        }, 2000);
      })
      .catch((err) => {
        this.setState({
          isUpdating: false,
          errMsg: err,
          showError: true,
        });
      });
  }

  render() {
    const { showWarnings, showError, isUpdating, success, errMsg } = this.state;
    const { namespaceName, setName, indexName, binName, binType } = this.state;
    const mns = this.props.namespaces;
    const namespaces = Object.keys(mns);
    const sets = namespaceName ? mns[namespaceName] : [];

    const nsWarning = showWarnings && !namespaceName;
    const setWarning = showWarnings && !setName;
    const indexWarning = showWarnings && !indexName;
    const binWarning = showWarnings && !binName;

    const msg = `Successfully created index ${indexName}`;
    return (
      <div>
        {success && 
          <AlertModal header="Success" message={msg} type="success" />
        }

        <div className="row">
          <div className="col-xl-12 as-section-header"> 
            Create Index
          </div>
        </div>
        <Form>
          <FormGroup color={indexWarning ? 'warning' : ''}>
            <Label> Index Name </Label>
            <Input  state={indexWarning ? 'warning' : ''}
                    required type="text" name="indexName" onChange={this.onInputChange} value={indexName}
                    placeholder="Index Name" disabled={isUpdating} />
          </FormGroup>

          <FormGroup color={nsWarning ? 'warning' : ''}>
            <Label> Namespace Name </Label>
            <Input  state={nsWarning ? 'warning' : ''}
                    required type="select" name="namespaceName" onChange={this.onInputChange} value={namespaceName}
                    placeholder="Namespace Name" disabled={isUpdating}>
              {namespaces.map((ns) => {
                return (
                    <option key={ns} value={ns}> {ns} </option>
                );
              })}
                    <option value=""> -- </option>
            </Input>
          </FormGroup>

          <FormGroup color={setWarning ? 'warning' : ''}>
            <Label> Set Name </Label>
            <Input  state={setWarning ? 'warning' : ''}
                    required type="select" name="setName" onChange={this.onInputChange} value={setName}
                    placeholder="Set Name" disabled={isUpdating || !namespaceName} >
              {sets.map((set) => {
                return (
                    <option key={set} value={set}> {set} </option>
                );
              })}
                    <option value=""> -- </option>
            </Input>
          </FormGroup>

          <FormGroup color={binWarning ? 'warning' : ''}>
            <Label> Bin Name </Label>
            <Input  state={binWarning ? 'warning' : ''}
                    required type="text" name="binName" onChange={this.onInputChange} value={binName}
                    placeholder="Bin Name" disabled={isUpdating} />
          </FormGroup>

          <FormGroup>
            <Label> Bin Type </Label>
            <Input required type="select" name="binType" onChange={this.onInputChange} value={binType}
                    placeholder="Bin Type" disabled={isUpdating}>
              <option key={BinTypes.string} value={BinTypes.string}> {BinTypes.string} </option>
              <option key={BinTypes.numeric} value={BinTypes.numeric}> {BinTypes.numeric} </option>
            </Input>
          </FormGroup>

          <div>
            <Button disabled={isUpdating} color="primary" size="sm" onClick={this.onCreate}> Add </Button>
            {!isUpdating && showError &&
            <span className="as-error-text"> {errMsg} </span>}

            {isUpdating && 
            <Spinner />}
          </div>
        </Form>
      </div>
    );
  }
}

IndexCreate.PropTypes = {
  clusterID: PropTypes.string,
  // map of namespace name to an array of the sets in the namespace
  namespaces: PropTypes.object.isRequired,

  // callback when the index is created successfully
  // onCreateIndexSuccess(clusterID, indexName)
  onCreateIndexSuccess: PropTypes.func,
};

export default IndexCreate;




