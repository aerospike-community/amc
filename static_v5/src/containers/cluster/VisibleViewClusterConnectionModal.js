import { connect } from 'react-redux';
import ViewClusterConnectionModal from 'components/cluster/ViewClusterConnectionModal';
import { toClusterPath } from 'classes/entityTree';
import { deleteClusterConnection } from 'actions/clusters';
import { selectStartView, selectCluster } from 'actions/currentView';
import { CLUSTER_ACTIONS } from 'classes/entityActions';
import { selectPath } from 'actions/currentView';

let Clusters; // the clusters
let CurrentClusterID;

const mapStateToProps = (state) => {
  Clusters = state.clusters.items;

  const { clusterID, view } = state.currentView;
  const cluster = state.clusters.items.find((i) => i.id === clusterID);

  CurrentClusterID = cluster.id;

  return {
    clusterID: cluster.id,
    clusterName: cluster.name,
    seeds: cluster.seeds,
    view: view === CLUSTER_ACTIONS.Delete ? 'delete' : 'view'
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onDeleteSuccess: (clusterID) => {
      // delete connection
      dispatch(deleteClusterConnection(clusterID));

      // select another view
      for (let i = 0; i < Clusters.length; i++) {
        let c = Clusters[i];
        if (c.id !== clusterID) {
          dispatch(selectCluster(c.id, CLUSTER_ACTIONS.Overview));
          return;
        }
      }

      dispatch(selectStartView());
    },

    onCancel: () => {
      const path = toClusterPath(CurrentClusterID);
      dispatch(selectPath(path, CLUSTER_ACTIONS.Overview));
    }
  };
}

const VisibleViewClusterConnectionModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewClusterConnectionModal);

export default VisibleViewClusterConnectionModal;




