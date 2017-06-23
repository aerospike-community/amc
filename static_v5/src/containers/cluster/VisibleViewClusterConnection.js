import { connect } from 'react-redux';
import ViewClusterConnection from 'components/cluster/ViewClusterConnection';
import { deleteClusterConnection } from 'actions/clusters';
import { selectStartView, selectCluster } from 'actions/currentView';
import { CLUSTER_ACTIONS } from 'classes/entityActions';

let Clusters; // the clusters

const mapStateToProps = (state) => {
  Clusters = state.clusters.items;

  const { clusterID, view } = state.currentView;
  const cluster = state.clusters.items.find((i) => i.id === clusterID);
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
  };
}

const VisibleViewClusterConnection = connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewClusterConnection);

export default VisibleViewClusterConnection;




