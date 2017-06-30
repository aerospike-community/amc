import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { SET_ACTIONS } from 'classes/entityActions';
import { getSet, deleteSet } from 'api/set';
import SetsTable from 'components/set/SetsTable';
import Spinner from 'components/Spinner';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

// SetView diplays a view of the set
class SetView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null,

      deleteShowConfirm: false,
      deleteInProgress: false,
      deleteSuccessfull: null,
      deleteErrorMsg: '',
    };

    this.onShowConfirm = this.onShowConfirm.bind(this);
    this.onDeleteSuccess = this.onDeleteSuccess.bind(this);
    this.onDeleteSet = this.onDeleteSet.bind(this);
  }

  onShowConfirm() {
    this.setState({
      deleteShowConfirm: true,
    });
  }

  onDeleteSuccess() {
    this.props.onDeleteSuccess();
  }

  onDeleteSet() {
    const { clusterID, nodeHost, namespaceName, setName } = this.props;
    this.setState({
      deleteInProgress: true
    });
    deleteSet(clusterID, nodeHost, namespaceName, setName)
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
          deleteErrorMsg: msg || 'Failed to delete set'
        });
      });
  }

  componentWillMount() {
    const {clusterID, nodeHost, namespaceName, setName} = this.props;
    getSet(clusterID, nodeHost, namespaceName, setName)
      .then((response) => {
        this.setState({
          data: response.set
        });
      })
      .catch((message) => {
        console.error(message);
      });
  }

  renderDeleteModal() {
    const { deleteShowConfirm, deleteInProgress, deleteSuccessfull, deleteErrorMsg } = this.state;

    const onCancelModal = () => {
      this.setState({
        deleteShowConfirm: false
      });
    };

    if (!deleteShowConfirm)
      return null;

    const disabled = deleteInProgress || deleteSuccessfull;
    if (!deleteInProgress && deleteSuccessfull === true) {
      return (
        <Modal isOpen={true} toggle={() => {}}>
          <ModalHeader> Success </ModalHeader>
          <ModalBody> Successfully deleted {this.props.udfName} </ModalBody>
        </Modal>
      );
    }

    return (
      <Modal isOpen={true} toggle={() => {}}>
        <ModalHeader> Confirm </ModalHeader>
        <ModalBody>  Delete {this.props.setName} ?  </ModalBody>
        <ModalFooter>
          {!deleteInProgress && deleteSuccessfull === false &&
            errorMsg}
          {deleteInProgress &&
           <span> <Spinner /> Deleting ... </span>}
          <Button disabled={disabled} color="primary" onClick={this.onDeleteSet}>Confirm</Button>
          <Button disabled={disabled} color="secondary" onClick={onCancelModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  render() {
    const {view} = this.props;
    const isDelete = view === SET_ACTIONS.Delete;

    const sets = [];
    if (this.state.data)
      sets.push(this.state.data);

    return (
      <div>
        {this.renderDeleteModal()}

        <SetsTable sets={sets} />

        {isDelete &&
        <div>
          <Button color="danger" size="sm" onClick={this.onShowConfirm}> Delete </Button>
        </div>
        }

      </div>
    );
  }
}

SetView.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
  namespaceName: PropTypes.string.isRequired,
  setName: PropTypes.string.isRequired,

  // View or Delete
  view: PropTypes.string.isRequired,
  // callback on successfull delete
  // onDeleteSuccess()
  onDeleteSuccess: PropTypes.func,
};


export default SetView;
