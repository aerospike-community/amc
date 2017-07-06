import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import classNames from 'classnames';

import Seed from 'components/cluster/Seed';
import Spinner from 'components/Spinner';

// SaveClusterConnection is a "view only" component to save
// a cluster connection.
//
// The actual API call is the responsibility of the parent component.
//
class SaveClusterConnection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clusterName: this.props.clusterName,
      seeds: this.props.seeds.slice(), // copy
      input: {
        host: '',
        port: '',
        tlsName: ''
      },

      showWarnings: false,
    };

    this.onSaveConnection = this.onSaveConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);

    this.onInputChange = this.onInputChange.bind(this);
    this.onSeedChange = this.onSeedChange.bind(this);
    this.removeSeed = this.removeSeed.bind(this);
    this.addSeed = this.addSeed.bind(this);
  }

  onSaveConnection() {
    if (!this.isFormValid()) {
      this.setState({
        showWarnings: true
      });
      return;
    }

    const {clusterName, seeds} = this.state;
    let connection = {
      name: clusterName,
    };
    connection.seeds = seeds.map((seed) => {
      seed.port = parseInt(seed.port, 10);
      return seed;
    });

    this.props.onSaveConnection(connection);
  }

  onCancel() {
    this.props.onCancel();
  }

  onInputChange(evt) {
    const target = evt.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
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
    if (!clusterName || seeds.length === 0)
      return false;

    let valid = seeds.every((seed) => 
      seed.host !== '' && seed.port !== ''
    );
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
      <div key={i} style={{marginBottom: 5}}>
        <Seed seed={seed} showWarnings={showWarnings} disabled={inProgress} button={button} onInputChange={onInputChange} />
      </div>
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
      marginTop: 0,
      paddingTop: 5,
      borderTop: '1px solid #e5e5e5'
    };
    if (this.state.seeds.length > 0)
      style.marginTop = 20;

    return (
      <div key={"input-seed"} style={style}>
        <Seed seed={seed} showWarnings={false} disabled={inProgress} button={button} onInputChange={onInputChange} />
      </div>
      );
  }

  render() {
    const inProgress = this.props.inProgress;
    const showWarnings = this.state.showWarnings;
    const nameWarning = showWarnings && !this.state.clusterName;
    const seedsWarning = showWarnings && this.state.seeds.length === 0;
    const { hideCancel } = this.props;

    return (
      <div>
        <form>
          <div className={classNames('form-group', {
                            'has-warning': nameWarning
                          })}>
            <label> Cluster Name </label>
            <input type="text" className={classNames('form-control', {'form-control-warning': nameWarning})} 
                  disabled={inProgress} onChange={this.onInputChange} name="clusterName" value={this.state.clusterName} />
          </div>
          <legend>
            Seeds
            {seedsWarning && <span className="as-warning-text"> * seed node required for a cluster </span>}
          </legend>
          <div className="row">
            <div className="col-xl-3">
              <label> Host </label>
            </div>
            <div className="col-xl-3">
              <label> Port </label>
            </div>
            <div className="col-xl-3">
              <label> TLS Name </label>
            </div>
          </div>
          {this.state.seeds.map((seed, i) => this.renderSeed(seed, i))}
          {this.renderInput()}

        </form>

        <div className="as-submit-footer float-right">
          {inProgress &&
           <span> <Spinner /> Saving ... </span>}

          <span> {this.props.onSaveErrorMessage} </span>
          <Button disabled={inProgress} color="primary" onClick={this.onSaveConnection}>Save</Button>
          
          {!hideCancel &&
          <Button disabled={inProgress} color="secondary" onClick={this.onCancel}>Cancel</Button>
          }
        </div>
      </div>
      );
  }
}

SaveClusterConnection.PropTypes = {
  // name of cluster
  clusterName: PropTypes.string,
  // seeds in the cluster
  seeds: PropTypes.array,
  // adding a connection is in progress
  inProgress: PropTypes.bool,
  // error message on save
  onSaveErrorMessage: PropTypes.bool,
  // callback to update a connection
  // callback(connection)
  onSaveConnection: PropTypes.func,
  // callback to cancel 
  // onCancel()
  onCancel: PropTypes.func,
  hideCancel: PropTypes.bool,
};

export default SaveClusterConnection;

