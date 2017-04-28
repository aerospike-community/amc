import React from 'react';
import { connect } from 'react-redux';
import AddClusterModal from '../components/AddClusterModal';
import { addClusterConnection, displayAddClusterConnection } from '../actions/clusters';

const mapStateToProps = (state) => {
  return {
    inProgress: state.clusters.isUpdating
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onAddConnection: (connection) => {
      dispatch(addClusterConnection(connection));
    },
    onCancel: () => {
      dispatch(displayAddClusterConnection(false));
    }
  };
}

const VisibleAddClusterModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(AddClusterModal);

export default VisibleAddClusterModal;


