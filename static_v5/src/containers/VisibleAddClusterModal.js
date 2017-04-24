import React from 'react';
import { connect } from 'react-redux';
import AddClusterModal from '../components/AddClusterModal';
import { addClusterConnection, displayAddClusterConnection } from '../actions';

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
  null,
  mapDispatchToProps
)(AddClusterModal);

export default VisibleAddClusterModal;


