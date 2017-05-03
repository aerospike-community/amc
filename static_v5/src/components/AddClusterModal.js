import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import classNames from 'classnames';

import Seed from './Seed';

class AddClusterModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clusterName: '',
      seeds: [],
      input: {
        host: '',
        port: '',
        tlsName: ''
      },

      showWarnings: false,
    };

    this.onAddConnection = this.onAddConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);

    this.onNameChange = this.onNameChange.bind(this);
    this.onSeedChange = this.onSeedChange.bind(this);
    this.removeSeed = this.removeSeed.bind(this);
    this.addSeed = this.addSeed.bind(this);
  }

  onAddConnection() {
    if (!this.isFormValid()) {
      this.setState({
        showWarnings: true
      });
      return;
    }

    const {clusterName, seeds} = this.state;
    const connection = {
      name: clusterName,
      seeds: seeds
    };
    this.props.onAddConnection(connection);
  }

  onCancel() {
    this.props.onCancel();
  }

  onNameChange(evt) {
    const value = evt.target.value;

    this.setState({
      clusterName: value
    });
  }

  onSeedChange(evt, index = -1) {
    const value = evt.target.value;
    const name = evt.target.name;

    if (index === -1) { // the input has changed
      const input = Object.assign({}, this.state.input, {
        [name]: value
      });
      this.setState({
        input: input
      });
    } else { // one of the seeds has changed
      const seeds = this.state.seeds.slice(); // copy
      const seed = Object.assign({}, seeds[index], {
        [name]: value
      });
      seeds[index] = seed;
      this.setState({
        seeds: seeds
      });
    }
  }

  removeSeed(i) {
    let seeds = this.state.seeds.slice(); // copy
    seeds.splice(i, 1);
    this.setState({
      seeds: seeds
    });
  }

  addSeed(seed) {
    const seeds = this.state.seeds.slice(); // copy
    seeds.push(seed);
    this.setState({
      seeds: seeds,
      input: {
        host: '',
        port: '',
        tlsName: ''
      }
    });
  }

  isFormValid() {
    const {clusterName, seeds} = this.state;
    if (!clusterName)
      return false;
    if (seeds.length === 0)
      return false;

    let valid = true;
    seeds.map((seed) => {
      if (!seed.host || !seed.port)
        valid = false;
    })
    return valid;
  }

  renderSeed(seed, i) {
    const showWarnings = this.state.showWarnings;
    const inProgress = this.props.inProgress;
    const button = {
      name: 'Remove',
      onClick: () => this.removeSeed(i)
    };
    const onInputChange = (evt) => this.onSeedChange(evt, i);
    return (
      <Seed key={i} seed={seed} showWarnings={showWarnings} disabled={inProgress} button={button} onInputChange={onInputChange}
      />
      );
  }

  renderInput() {
    const seed = this.state.input;
    const inProgress = this.props.inProgress;
    const button = {
      name: 'Add',
      onClick: () => this.addSeed(seed)
    };
    const onInputChange = (evt) => this.onSeedChange(evt);
    const style = {
      marginBottom: 10,
      marginTop: 20,
      paddingTop: 5,
      borderTop: '1px solid #e5e5e5'
    };
    return (
      <div style={style}>
        <Seed seed={seed} showWarnings={false} disabled={inProgress} button={button} onInputChange={onInputChange} />
      </div>
      );
  }

  render() {
    const inProgress = this.props.inProgress;
    const showWarnings = this.state.showWarnings;
    const nameWarning = showWarnings && !this.state.clusterName;
    const seedsWarning = showWarnings && this.state.seeds.length === 0;
    return (
      <Modal size="lg" isOpen={true} toggle={() => {
                                       }}>
        <ModalHeader>Add Cluster Connection</ModalHeader>
        <ModalBody>
          <form>
            <div className={classNames('form-group', {
                              'has-warning': nameWarning
                            })}>
              <label> Cluster Name </label>
              <input type="text" className={classNames('form-control', {
                                              'form-control-warning': nameWarning
                                            })} disabled={inProgress} onChange={this.onNameChange} name="clusterName" value={this.state.clusterName} />
            </div>
            <legend>
              Seeds
              {seedsWarning && <span style={{ fontSize: 12, color: 'orange' }}> * seed node required for a cluster </span>}
            </legend>
            <div className="row">
              <div className="col-3">
                <label> Host </label>
              </div>
              <div className="col-3">
                <label> Port </label>
              </div>
              <div className="col-3">
                <label> TLS Name </label>
              </div>
            </div>
            {this.state.seeds.map((seed, i) => this.renderSeed(seed, i))}
            {this.renderInput()}
          </form>
        </ModalBody>
        <ModalFooter>
          {inProgress &&
           <span> Creating ... </span>}
          <Button disabled={inProgress} color="primary" onClick={this.onAddConnection}>Add</Button>
          <Button disabled={inProgress} color="secondary" onClick={this.onCancel}>Cancel</Button>
        </ModalFooter>
      </Modal>
      );
  }
}

AddClusterModal.PropTypes = {
  // adding a connection is in progress
  inProgress: PropTypes.bool,
  // callback to add a connection
  // callback(properties) TODO add properties
  onAddConnection: PropTypes.func,
  // callback to cancel the modal
  onCancel: PropTypes.func,
};

export default AddClusterModal;
