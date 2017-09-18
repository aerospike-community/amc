import { connect } from 'react-redux';
import AddClusterModal from 'components/cluster/AddClusterModal';
import { initClusters, displayAddClusterConnection } from 'actions/clusters';

let CurrentView;

const mapStateToProps = (state) => {
  CurrentView = state.currentView;
  return null;
};

const mapDispatchToProps = (dispatch) => {
  return {
    // on connection success
    onConnectionAddSuccess: (connection) => {
      // close modal
      dispatch(displayAddClusterConnection(false));
      // refetch clusters
      dispatch(initClusters(CurrentView));
    },

    // cancel the view
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


