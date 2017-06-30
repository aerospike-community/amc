import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Tabs from 'components/Tabs';
import SetView from 'components/set/SetView';
import { SET_ACTIONS } from 'classes/entityActions';

// SetDashboard diplays all views of a set
class SetDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.views = [SET_ACTIONS.View, SET_ACTIONS.Delete];

    this.onViewSelect = this.onViewSelect.bind(this);
    this.onShowSetOverview = this.onShowSetOverview.bind(this);
  }

  onViewSelect(view) {
    const {clusterID, nodeHost, namespaceName, setName} = this.props;
    this.props.onSetSelect(clusterID, nodeHost, namespaceName, setName, view);
  }

  onShowSetOverview() {
    const {clusterID, nodeHost, namespaceName} = this.props;
    this.props.onShowSetOverview(clusterID, nodeHost, namespaceName);
  }

  render() {
    const {clusterID, nodeHost, namespaceName, setName, view} = this.props;

    return (
      <div>
        <Tabs names={this.views} selected={view} onSelect={this.onViewSelect}/>


        <SetView clusterID={clusterID} nodeHost={nodeHost} 
                namespaceName={namespaceName} setName={setName} view={view} 
                onDeleteSuccess={this.onShowSetOverview}/>
      </div>
    );
  }
}

SetDashboard.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
  namespaceName: PropTypes.string.isRequired,
  setName: PropTypes.string.isRequired,

  view: PropTypes.string.isRequired,
  // callback for when a view for the set is selected
  // onSetSelect(clusterID, nodeHost, namespaceName, setName, view)
  onSetSelect: PropTypes.func,
  // callback to show the set overview
  // onShowSetOverview(clusterID, nodeHost, namespaceName)
  onShowSetOverview: PropTypes.func,
};

export default SetDashboard;
