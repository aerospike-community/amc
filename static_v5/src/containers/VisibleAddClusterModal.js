import React from 'react';
import { connect } from 'react-redux';
import AddClusterModal from '../components/AddClusterModal';
import { displayAddClusterConnection } from '../actions';

const mapDispatchToProps = (dispatch) => {
  return {
    onAddConnection: () => {
      dispatch(displayAddClusterConnection(false));
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


