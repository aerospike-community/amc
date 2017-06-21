import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import classNames from 'classnames';

import ChangeClusterConnection from 'components/cluster/ChangeClusterConnection';
import { updateConnection as updateConnectionAPI } from 'api/clusterConnections';
import { getConnectionDetails } from 'api/clusterConnections';

// ManageClusterConnection shows a view to manage a cluster connection
class ManageClusterConnection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inProgress: false,
      onSaveErrorMessage: '',
      isFetching: true,
      clusterOverview: null,
    };

    this.onUpdateConnection = this.onUpdateConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    const { clusterID }  = this.props;
    getConnectionDetails(clusterID)
      .then((details) => {
        this.setState({
          isFetching: false,
          clusterOverview: details
        });
      })
      .catch(() => {
        // TODO
      });
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
    const { clusterName, clusterID } = this.props;
    const co = this.state.clusterOverview;
    const nodeHosts = co ? co.nodes : [];
    return (
      <div>
        <div className="as-centerpane-header">
          Manage Cluster Connection {nodeHosts}
        </div>
        <ChangeClusterConnection clusterID={clusterID} clusterName={clusterName} inProgress={this.state.inProgress}
          onSaveErrorMessage={this.state.onSaveErrorMessage} onCancel={this.onCancel} nodeHosts={nodeHosts}  />
      </div>
      );
  }
}

ManageClusterConnection.PropTypes = {
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

export default ManageClusterConnection;
