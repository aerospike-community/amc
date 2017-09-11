import { connect } from 'react-redux';

import IndexesOverviewDashboard from 'components/index/IndexesOverviewDashboard';
import { selectIndex, selectViewForViewType } from 'actions/currentView';
import { addIndex } from 'actions/clusters';
import { INDEX_ACTIONS } from 'classes/entityActions';

function extractNamespaces(entityTree) {
  const namespaces = {};

  entityTree.nodes.forEach((node) => {
    node.namespaces.forEach((ns) => {
      const { name } = ns;
      const sets = namespaces[name] || [];

      if (!ns.hasOwnProperty('sets'))
        return;

      ns.sets.forEach((set) => {
        const setName = set.name;
        const i = sets.findIndex((s) => s === setName);
        if (i === -1)
          sets.push(setName);
      });

      namespaces[name] = sets;
    });
  });

  return namespaces;
}

const  mapStateToProps = (state) => {
  const { clusterID, view } = state.currentView;
  const cluster = state.clusters.items.find((c) => c.id === clusterID);
  
  return {
    clusterID: clusterID,
    view: view,
    namespaces: extractNamespaces(cluster),
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onViewSelect: (view) => {
      dispatch(selectViewForViewType(view));
    },

    onSelectIndex: (clusterID, indexName) => {
      dispatch(selectIndex(clusterID, indexName, INDEX_ACTIONS.View));
    },

    onCreateIndexSuccess: (clusterID, indexName) => {
      dispatch(addIndex(clusterID, indexName));
      dispatch(selectIndex(clusterID, indexName, INDEX_ACTIONS.View));
    }
  };
}

const VisibleIndexesOverviewDashboard = connect(
    mapStateToProps,
    mapDispatchToProps
)(IndexesOverviewDashboard);

export default VisibleIndexesOverviewDashboard;




