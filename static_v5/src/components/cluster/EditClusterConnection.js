import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import classNames from 'classnames';

import UpdateClusterConnection from './UpdateClusterConnection';

class EditClusterConnection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inProgress: false
    };

    this.onUpdateConnection = this.onUpdateConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onUpdateConnection(connection) {
    this.setState({
      inProgress: true
    });

    const { clusterID } = this.props;
    this.props.onUpdateConnection(clusterID, connection);
  }

  onCancel() {
    this.props.onCancel();
  }

  render() {
    const { clusterName, seeds } = this.props;
    return (
      <div>
        <h3>Update Cluster Connection</h3>
        <UpdateClusterConnection clusterName={clusterName} seeds={seeds} inProgress={this.state.inProgress}
          updateConnection={this.onUpdateConnection} cancel={this.onCancel} />
      </div>
      );
  }
}

EditClusterConnection.PropTypes = {
  clusterID: PropTypes.string,
  clusterName: PropTypes.string,
  // seeds of cluster
  seeds: PropTypes.array,
  // callback to add a connection
  // onUpdateConnection(connection)
  onUpdateConnection: PropTypes.func,
  // callback to cancel the modal
  // onCancel()
  onCancel: PropTypes.func,
};

export default EditClusterConnection;
