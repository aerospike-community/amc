import { connect } from 'react-redux';
import DeleteConnectionModal from 'components/cluster/DeleteConnectionModal';
import { deleteClusterConnection, displayDeleteClusterConnection } from 'actions/clusters';
import { selectStartView, selectCluster } from 'actions/currentView';
import { CLUSTER_ACTIONS } from 'classes/entityActions';

let Clusters; // the clusters

const mapStateToProps = (state) => {
  Clusters = state.clusters.items;

  const { clusterID } = state.currentView;
  const cluster = state.clusters.items.find((i) => i.id === clusterID);
  return {
    connection: cluster,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onConnectionDeleteSuccess: (connection) => {
      // close modal
      dispatch(displayDeleteClusterConnection(false));
      // delete connection
      dispatch(deleteClusterConnection(connection));

      // select another view
      for (let i = 0; i < Clusters.length; i++) {
        let c = Clusters[i];
        if (c.id !== connection.id) {
          dispatch(selectCluster(c.id, CLUSTER_ACTIONS.Overview));
          return;
        }
      }

      dispatch(selectStartView());
    },

    // cancel the view
    onCancel: () => {
      dispatch(displayDeleteClusterConnection(false));
    }
  };
}

const VisibleDeleteConnectionModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeleteConnectionModal);

export default VisibleDeleteConnectionModal;



