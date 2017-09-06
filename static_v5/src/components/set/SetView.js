import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { isPermissibleSetAction, SET_ACTIONS } from 'classes/entityActions';
import { VIEW_TYPE } from 'classes/constants';
import { getSet, deleteSet } from 'api/set';
import SetsTable from 'components/set/SetsTable';
import Spinner from 'components/Spinner';
import AlertModal from 'components/AlertModal';
import { whenClusterHasCredentials } from 'classes/security';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

// SetView diplays a view of the set
class SetView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null,

      canDelete: false,

      deleteShowConfirm: false,
      deleteInProgress: false,
      deleteSuccessfull: null,
      deleteErrorMsg: '',
    };

    this.onShowConfirm = this.onShowConfirm.bind(this);
    this.onDeleteSuccess = this.onDeleteSuccess.bind(this);
    this.onDeleteSet = this.onDeleteSet.bind(this);
  }

  componentDidMount() {
    const { clusterID, namespaceName, setName } = this.props;
    this.setPermissions(clusterID, namespaceName, setName);
  }

  setPermissions(clusterID, namespace, set) {
    whenClusterHasCredentials(clusterID, () => {
      const canDelete = isPermissibleSetAction(SET_ACTIONS.Delete, clusterID, namespace, set);
      this.setState({
        canDelete: canDelete
      });
    });
  }

  onShowConfirm() {
    this.setState({
      deleteShowConfirm: true,
    });
  }

  onDeleteSuccess() {
    const { clusterID, nodeHost, namespaceName, setName } = this.props;
    this.props.onDeleteSuccess(clusterID, nodeHost, namespaceName, setName);
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

  fetchData(clusterID, nodeHost, namespaceName, setName) {
    this.setState({
      data: null,
    });

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

  componentWillMount() {
    const {clusterID, nodeHost, namespaceName, setName} = this.props;
    this.fetchData(clusterID, nodeHost, namespaceName, setName);
  }

  componentWillReceiveProps(nextProps) {
    let isSame = true;
    ['clusterID', 'nodeHost', 'namespaceName', 'setName'].forEach((p) => {
      if (nextProps[p] !== this.props[p])
        isSame = false;
    });

    if (isSame)
      return;

    const {clusterID, nodeHost, namespaceName, setName} = nextProps;
    this.setPermissions(clusterID, namespaceName, setName);
    this.fetchData(clusterID, nodeHost, namespaceName, setName);
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
      const message = `Successfully deleted ${this.props.setName}`;
      return (
        <AlertModal header="Success" message={message} type="success" />
      );
    }

    return (
      <Modal isOpen={true} toggle={() => {}}>
        <ModalHeader className="alert-danger"> Confirm </ModalHeader>
        <ModalBody>  Delete {this.props.setName} </ModalBody>
        <ModalFooter>
          {!deleteInProgress && deleteSuccessfull === false &&
            errorMsg}
          {deleteInProgress &&
           <span> <Spinner /> Deleting ... </span>}
          <Button disabled={disabled} color="danger" onClick={this.onDeleteSet}>Confirm</Button>
          <Button disabled={disabled} color="secondary" onClick={onCancelModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  render() {
    const {view} = this.props;

    const sets = [];
    if (this.state.data)
      sets.push(this.state.data);

    const { deleteInProgress, canDelete } = this.state;
    const {nodeHost, namespaceName, setName} = this.props;

    return (
      <div>
        {this.renderDeleteModal()}

        <div className="row">
          <div className="col-xl-12 as-section-header">
            {`Set - ${setName}`}

            {canDelete &&
            <Button className="float-right" disabled={deleteInProgress} color="danger" size="sm" onClick={this.onShowConfirm}> 
              <i className="fa fa-trash"></i>
              Delete 
            </Button>}
          </div>
        </div>

        <SetsTable sets={sets} initiallyExpandAll={true}/>
      </div>
    );
  }
}

SetView.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
  namespaceName: PropTypes.string.isRequired,
  setName: PropTypes.string.isRequired,

  // callback on successfull delete
  // onDeleteSuccess(clusterID, nodeHost, namespaceName, setName)
  onDeleteSuccess: PropTypes.func,
};


export default SetView;
