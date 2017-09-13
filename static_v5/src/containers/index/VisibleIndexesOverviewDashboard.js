import { connect } from 'react-redux';

import IndexesOverviewDashboard from 'components/index/IndexesOverviewDashboard';
import { selectIndex, selectViewForViewType } from 'actions/currentView';
import { addIndex } from 'actions/clusters';
import { INDEX_ACTIONS } from 'classes/entityActions';
import { isLogicalView } from 'classes/util';
import { VIEW_TYPE } from 'classes/constants';

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

let IsLogicalView;
const  mapStateToProps = (state) => {
  const { clusterID, view, viewType } = state.currentView;
  const cluster = state.clusters.items.find((c) => c.id === clusterID);

  IsLogicalView = isLogicalView(viewType);
  
  return {
    clusterID: clusterID,
    view: view,
    namespaces: extractNamespaces(cluster),
  };
}

const mapDispatchToProps = (dispatch) => {

  const onSelectIndex = (clusterID, indexName) => {
    const vt = IsLogicalView ? VIEW_TYPE.LOGICAL_INDEX : VIEW_TYPE.INDEX;
    dispatch(selectIndex(clusterID, indexName, INDEX_ACTIONS.View, vt));
  };

  return {
    onViewSelect: (view) => {
      dispatch(selectViewForViewType(view));
    },

    onSelectIndex: onSelectIndex,

    onCreateIndexSuccess: (clusterID, indexName) => {
      dispatch(addIndex(clusterID, indexName));
      onSelectIndex(clusterID, indexName);
    }
  };
}

const VisibleIndexesOverviewDashboard = connect(
    mapStateToProps,
    mapDispatchToProps
)(IndexesOverviewDashboard);

export default VisibleIndexesOverviewDashboard;




