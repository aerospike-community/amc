import { connect } from 'react-redux';
import AddClusterModal from '../components/cluster/AddClusterModal';
import { fetchClusters, displayAddClusterConnection } from '../actions/clusters';

const mapDispatchToProps = (dispatch) => {
  return {
    // on connection success
    onConnectionAddSuccess: (connection) => {
      // close modal
      dispatch(displayAddClusterConnection(false));
      // FIXME connection should be a success response
      // from the server
      // refetch clusters
      dispatch(fetchClusters());
    },

    // cancel the view
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


