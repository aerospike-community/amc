import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import classNames from 'classnames';

import SaveClusterConnection from 'components/cluster/SaveClusterConnection';
import { updateConnection as updateConnectionAPI } from 'api/clusterConnections';

// EditClusterConnection shows a view to edit a cluster connection
class EditClusterConnection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inProgress: false,
      onSaveErrorMessage: '',
    };

    this.onUpdateConnection = this.onUpdateConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onUpdateConnection(connection) {
    this.setState({
      inProgress: true,
      onSaveErrorMessage: '',
    });

    // send
    const { clusterID } = this.props;
    updateConnectionAPI(clusterID, connection)
      .then((response) => {
        // FIXME the response should have the newly added connection
        this.props.onUpdateConnectionSuccess(clusterID, connection);
      })
      .catch((response) => {
        this.setState({
          inProgress: false,
          onSaveErrorMessage: response
        });
      });
  }

  onCancel() {
    this.props.onCancel();
  }

  render() {
    const { clusterName, seeds } = this.props;
    return (
      <div>
        <div className="as-centerpane-header">
          Update Cluster Connection
        </div>
        <SaveClusterConnection clusterName={clusterName} seeds={seeds} inProgress={this.state.inProgress}
          onSaveErrorMessage={this.state.onSaveErrorMessage}
          onSaveConnection={this.onUpdateConnection} onCancel={this.onCancel} />
      </div>
      );
  }
}

EditClusterConnection.PropTypes = {
  clusterID: PropTypes.string,
  clusterName: PropTypes.string,
  // seeds of cluster
  seeds: PropTypes.array,
  // callback when the connection is successfully updated
  // onUpdateConnectionSuccess(clusterID, connection)
  onUpdateConnectionSuccess: PropTypes.func,
  // callback to cancel the view
  // onCancel()
  onCancel: PropTypes.func,
};

export default EditClusterConnection;
