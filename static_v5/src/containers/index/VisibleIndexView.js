import { connect } from 'react-redux';

import IndexView from 'components/index/IndexView';
import { selectIndexesOverview } from 'actions/currentView';
import { deleteIndex } from 'actions/clusters';
import { INDEXES_OVERVIEW_ACTIONS } from 'classes/entityActions';

const  mapStateToProps = (state) => {
  const { clusterID, indexName } = state.currentView;
  return {
    clusterID: clusterID,
    indexName: indexName,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onDeleteSuccess: (clusterID, namespaceName, setName, indexName) => {
      dispatch(deleteIndex(clusterID, namespaceName, setName, indexName));
      dispatch(selectIndexesOverview(clusterID, INDEXES_OVERVIEW_ACTIONS.View));
    },
  };
}

const VisibleSetView = connect(
    mapStateToProps,
    mapDispatchToProps
)(IndexView);

export default VisibleSetView;






