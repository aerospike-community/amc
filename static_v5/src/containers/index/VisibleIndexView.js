import { connect } from 'react-redux';

import IndexView from 'components/index/IndexView';
import { selectIndexesOverview } from 'actions/currentView';
import { deleteIndex } from 'actions/clusters';
import { INDEXES_OVERVIEW_ACTIONS } from 'classes/entityActions';
import { isLogicalView } from 'classes/util';
import { VIEW_TYPE } from 'classes/constants';

let IsLogicalView;

const  mapStateToProps = (state) => {
  const { clusterID, indexName, viewType } = state.currentView;

  IsLogicalView = isLogicalView(viewType);

  return {
    clusterID: clusterID,
    indexName: indexName,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onDeleteSuccess: (clusterID, namespaceName, setName, indexName) => {
      dispatch(deleteIndex(clusterID, namespaceName, setName, indexName));

      const vt = IsLogicalView ? VIEW_TYPE.LOGICAL_INDEXES_OVERVIEW 
                               : VIEW_TYPE.INDEXES_OVERVIEW;
      dispatch(selectIndexesOverview(clusterID, INDEXES_OVERVIEW_ACTIONS.Overview, vt));
    },
  };
}

const VisibleSetView = connect(
    mapStateToProps,
    mapDispatchToProps
)(IndexView);

export default VisibleSetView;






