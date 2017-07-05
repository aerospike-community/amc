import { connect } from 'react-redux';

import IndexesOverview from 'components/index/IndexesOverview';
import { selectIndex } from 'actions/currentView';
import { INDEX_ACTIONS } from 'classes/entityActions';

const  mapStateToProps = (state) => {
  const { clusterID } = state.currentView;
  return {
    clusterID: clusterID,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onSelectIndex: (clusterID, indexName) => {
      dispatch(selectIndex(clusterID, indexName, INDEX_ACTIONS.View));
    },
  };
}

const VisibleIndexesOverview = connect(
    mapStateToProps,
    mapDispatchToProps
)(IndexesOverview);

export default VisibleIndexesOverview;




