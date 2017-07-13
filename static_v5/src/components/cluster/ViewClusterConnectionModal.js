import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Table } from 'reactstrap';
import classNames from 'classnames';

import { deleteConnection } from 'api/clusterConnections';
import Spinner from 'components/Spinner';

// ViewClusterConnectionModal shows a view for the cluster connection
class ViewClusterConnectionModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      deleteInProgress: false,
      deleteSuccessfull: null,
      deleteErrorMsg: '',
    };

    this.onDeleteSuccess = this.onDeleteSuccess.bind(this);
    this.onDeleteConnection = this.onDeleteConnection.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onDeleteSuccess() {
    const { clusterID } = this.props;
    this.props.onDeleteSuccess(clusterID);
  }

  onCancel() {
    this.props.onCancel();
  }

  onDeleteConnection() {
    const { clusterID, udfName } = this.props;
    this.setState({
      deleteInProgress: true
    });
    deleteConnection(clusterID)
      .then(() => {
        this.setState({
          deleteInProgress: false,
          deleteSuccessfull: true
        });
        window.setTimeout(() => this.onDeleteSuccess(), 2000);
      })
      .catch((msg) => {
        this.setState({
          deleteInProgress: false,
          deleteSuccessfull: false,
          deleteErrorMsg: msg || 'Failed to delete connection'
        });
      });
  }

  seeds(seed) {
    const { seeds } = this.props;

    const data = [];
    seeds.forEach((seed) => {
      const { host, port, tlsName } = seed;
      const row = (
        <tr key={host}>
          <td> {host} </td>
          <td> {port} </td>
          <td> {tlsName} </td>
        </tr>
      );
      data.push(row);
    });

    return data;
  }

  renderSeeds() {
    return (
      <div className="row">
        <div className="col-xl-12"> 
          <Table size="sm" bordered hover>
            <thead>
              <tr>
                <th> Host </th>
                <th> Port </th>
                <th> TLS Name </th>
              </tr>
            </thead>
            <tbody>
              {this.seeds()}
            </tbody>
          </Table>
        </div>
      </div>
    );
  }

  render() {
    const { clusterName } = this.props;
    const { deleteInProgress, deleteSuccessfull, deleteErrorMsg } = this.state;

    if (!deleteInProgress && deleteSuccessfull === true) {
      return (
        <Modal isOpen={true} toggle={() => {}}>
          <ModalHeader> Success </ModalHeader>
          <ModalBody> Successfully deleted connection </ModalBody>
        </Modal>
      );
    }

    return (
      <Modal size="lg" isOpen={true} toggle={() => {}}>
        <ModalHeader> {clusterName} </ModalHeader>
        <ModalBody>
          {this.renderSeeds()}
        </ModalBody>  

        <ModalFooter>
          {!deleteInProgress && deleteSuccessfull === false &&
            errorMsg}
          {deleteInProgress &&
           <span> <Spinner /> Deleting ... </span>}
          <Button color="danger" onClick={this.onDeleteConnection}> Delete </Button>
          <Button onClick={this.onCancel}> Cancel </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

ViewClusterConnectionModal.PropTypes = {
  clusterID: PropTypes.string,
  clusterName: PropTypes.string,
  // seeds of the cluster
  seeds: PropTypes.array,
  // callback when the delete was successful
  // onDeleteSuccess(clusterID)
  onDeleteSuccess: PropTypes.func,
};

export default ViewClusterConnectionModal;

