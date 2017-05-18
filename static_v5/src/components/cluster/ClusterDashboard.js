import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ClusterOverview from './ClusterOverview';

// ClusterDashboard handles all the views for the cluster.
// It is also responsible for changing between different views
// of the cluster.
//
// The state of the view, view type is maintained outside of the component.
// Hence there are callbacks to the parent component to change these view states.
class ClusterDashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { clusterID }  = this.props;
    return (
      <div>
        <ClusterOverview clusterID={clusterID} />
      </div>
    );
  }
}

ClusterDashboard.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterDashboard;

