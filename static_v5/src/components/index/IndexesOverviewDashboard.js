import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from 'components/Tabs';
import IndexesOverview from 'components/index/IndexesOverview';
import IndexCreate from 'components/index/IndexCreate';
import { filterActions, INDEXES_OVERVIEW_ACTIONS } from 'classes/entityActions';
import { VIEW_TYPE } from 'classes/constants';
import { whenClusterHasCredentials } from 'classes/security';

class IndexesOverviewDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      views: []
    };

    this.onViewSelect = this.onViewSelect.bind(this);
    this.onCreateSuccess = this.onCreateSuccess.bind(this);
  }

  componentDidMount() {
    this.setViews();
  }

  setViews() {
    const { clusterID } = this.props;
    whenClusterHasCredentials(clusterID, () => {
      const actions = [INDEXES_OVERVIEW_ACTIONS.Overview, INDEXES_OVERVIEW_ACTIONS.Create];
      const views = filterActions(actions, clusterID, VIEW_TYPE.INDEXES_OVERVIEW);

      this.setState({
        views: views
      });
    });
  }

  onViewSelect(view) {
    this.props.onViewSelect(view);
  }

  onCreateSuccess(udfName, source, type) {
    const { clusterID } = this.props;
    this.props.onUDFCreateSuccess(clusterID, udfName, type);
  }

  render() {
    const { clusterID, view, onSelectIndex, onCreateIndexSuccess, namespaces } = this.props;
    const { views } = this.state;

    return (
      <div>
        <Tabs names={views} selected={view} onSelect={this.onViewSelect}/>

        {view === INDEXES_OVERVIEW_ACTIONS.Overview &&
        <IndexesOverview clusterID={clusterID} onSelectIndex={onSelectIndex}/>
        }

        {view === INDEXES_OVERVIEW_ACTIONS.Create &&
        <IndexCreate clusterID={clusterID} onCreateIndexSuccess={onCreateIndexSuccess} 
                     namespaces={namespaces} />
        }
      </div>
    );
  }
}

IndexesOverviewDashboard.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  // view 
  view: PropTypes.string.isRequired,
  // map of namespace name to an array of the sets in the namespace
  namespaces: PropTypes.object.isRequired,

  // callback to select a index
  // onSelectIndex(clusterID, indexName)
  onSelectIndex: PropTypes.func,
  // callback when the index is created successfully
  // onCreateIndexSuccess(clusterID, indexName)
  onCreateIndexSuccess: PropTypes.func,
};

export default IndexesOverviewDashboard;



