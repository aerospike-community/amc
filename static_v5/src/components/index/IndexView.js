import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getIndex, deleteIndex } from 'api/index';
import IndexesTable from 'components/index/IndexesTable';
import Spinner from 'components/Spinner';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

// IndexView diplays a view of the index
class IndexView extends React.Component {
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
    this.onDeleteIndex = this.onDeleteIndex.bind(this);
  }

  onShowConfirm() {
    this.setState({
      deleteShowConfirm: true,
    });
  }

  onDeleteSuccess() {
    const { clusterID, indexName } = this.props;
    this.props.onDeleteSuccess(clusterID, indexName);
  }

  onDeleteIndex() {
    const { clusterID, indexName } = this.props;
    const { namespace, set } = this.state.data;

    this.setState({
      deleteInProgress: true
    });
    deleteIndex(clusterID, namespace, set, indexName)
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
          deleteErrorMsg: msg || 'Failed to delete index'
        });
      });
  }

  fetchData(clusterID, indexName) {
    this.setState({
      data: null,
    });

    getIndex(clusterID, indexName)
      .then((index) => {
        this.setState({
          data: index
        });
      })
      .catch((message) => {
        console.error(message);
      });
  }

  componentWillMount() {
    const {clusterID, indexName} = this.props;
    this.fetchData(clusterID, indexName);
  }

  componentWillReceiveProps(nextProps) {
    let isSame = true;
    ['clusterID', 'indexName'].forEach((p) => {
      if (nextProps[p] !== this.props[p])
        isSame = false;
    });

    if (isSame)
      return;

    const {clusterID, indexName} = nextProps;
    this.fetchData(clusterID, indexName);
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
        <ModalBody>  Delete {this.props.indexName} ?  </ModalBody>
        <ModalFooter>
          {!deleteInProgress && deleteSuccessfull === false &&
            deleteErrorMsg}
          {deleteInProgress &&
           <span> <Spinner /> Deleting ... </span>}
          <Button disabled={disabled} color="primary" onClick={this.onDeleteIndex}>Confirm</Button>
          <Button disabled={disabled} color="secondary" onClick={onCancelModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  render() {
    const {view} = this.props;

    const indexes = [];
    if (this.state.data)
      indexes.push(this.state.data);

    const { deleteInProgress } = this.state;
    const {clusterID, indexName} = this.props;
    const header = `${clusterID} ${indexName}`;

    return (
      <div>
        {this.renderDeleteModal()}

        <IndexesTable indexes={indexes} header={header}/>

        <div>
          <Button disabled={deleteInProgress} color="danger" size="sm" onClick={this.onShowConfirm}> Delete </Button>
        </div>

      </div>
    );
  }
}

IndexView.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  indexName: PropTypes.string.isRequired,

  // callback on successfull delete
  // onDeleteSuccess(clusterID, indexName)
  onDeleteSuccess: PropTypes.func,
};


export default IndexView;

