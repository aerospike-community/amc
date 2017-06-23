import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Table } from 'reactstrap';
import classNames from 'classnames';

import { deleteConnection } from 'api/clusterConnections';
import Spinner from 'components/Spinner';

// ViewClusterConnection shows a view for the cluster connection
class ViewClusterConnection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      deleteShowConfirm: false,
      deleteInProgress: false,
      deleteSuccessfull: null,
      deleteErrorMsg: '',
    };

    this.onDeleteSuccess = this.onDeleteSuccess.bind(this);
    this.onShowConfirm = this.onShowConfirm.bind(this);
    this.onDeleteConnection = this.onDeleteConnection.bind(this);
  }

  onShowConfirm() {
    this.setState({
      deleteShowConfirm: true,
    });
  }

  onDeleteSuccess() {
    const { clusterID } = this.props;
    this.props.onDeleteSuccess(clusterID);
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

  renderDeleteModal() {
    const { deleteShowConfirm, deleteInProgress, deleteSuccessfull, deleteErrorMsg } = this.state;

    if (this.props.view !== 'delete' || !deleteShowConfirm)
      return null;

    const disabled = deleteInProgress || deleteSuccessfull;
    if (!deleteInProgress && deleteSuccessfull === true) {
      return (
        <Modal isOpen={true} toggle={() => {}}>
          <ModalHeader> Success </ModalHeader>
          <ModalBody> Successfully deleted connection </ModalBody>
        </Modal>
      );
    }

    const onCancelModal = () => {
      this.setState({
        deleteShowConfirm: false
      });
    };

    return (
      <Modal isOpen={true} toggle={() => {}}>
        <ModalHeader> Confirm </ModalHeader>
        <ModalBody>  Delete connection ?  </ModalBody>
        <ModalFooter>
          {!deleteInProgress && deleteSuccessfull === false &&
            errorMsg}
          {deleteInProgress &&
           <span> <Spinner /> Deleting ... </span>}
          <Button disabled={disabled} color="primary" onClick={this.onDeleteConnection}>Confirm</Button>
          <Button disabled={disabled} color="secondary" onClick={onCancelModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  renderSeeds(seed) {
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

  render() {
    const { clusterName } = this.props;
    const isDelete = this.props.view === 'delete';

    return (
      <div>
        {this.renderDeleteModal()}

        <div className="as-centerpane-header">
        {clusterName}
        </div>
        <div>
          <div className="row">
            <div className="col-xl-12"> 
              <Table size="sm" bordered>
                <thead>
                  <tr>
                    <th> Host </th>
                    <th> Port </th>
                    <th> TLS Name </th>
                  </tr>
                </thead>
                <tbody>
                  {this.renderSeeds()}
                </tbody>
              </Table>
            </div>
          </div>
        </div>

        {isDelete &&
        <div>
          <Button color="danger" size="sm" onClick={this.onShowConfirm}> Delete </Button>
        </div>
        }
      </div>
      );
  }
}

ViewClusterConnection.PropTypes = {
  clusterID: PropTypes.string,
  clusterName: PropTypes.string,
  // seeds of the cluster
  seeds: PropTypes.array,
  // the view of interest. view or delete
  view: PropTypes.string,
  // callback when the delete was successful
  // onDeleteSuccess(clusterID)
  onDeleteSuccess: PropTypes.func,
};

export default ViewClusterConnection;

