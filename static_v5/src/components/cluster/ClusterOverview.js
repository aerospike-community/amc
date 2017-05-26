import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ClusterStorage from 'components/cluster/ClusterStorage';
import ClusterSummary from 'components/cluster/ClusterSummary';
import ClusterPerformance from 'components/cluster/ClusterPerformance';
import ClusterNodes from 'components/cluster/ClusterNodes';
import ClusterNamespaces from 'components/cluster/ClusterNamespaces';

import { getConnectionDetails } from 'api/clusterConnections';

// ClusterOverview provides an overview of the cluster
class ClusterOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: true,
      clusterOverview: null
    };
  }

  componentDidMount() {
    const { clusterID }  = this.props;
    getConnectionDetails(clusterID)
      .then((details) => {
        this.setState({
          isFetching: false,
          clusterOverview: details
        });
      })
      .catch(() => {
        // TODO
      });
  }

  render() {
    const { clusterID }  = this.props;
    const co = this.state.clusterOverview;

    return (
      <div> 
        {this.state.isFetching && 
          <div> Loading ... </div>
        }
        {!this.state.isFetching && 
          <div>
            <div className="row">
              <div className="col-4">
                <ClusterStorage name={'Disk'} storage={co.disk} />
              </div>
              <div className="col-4">
                <ClusterStorage name={'RAM'} storage={co.memory} />
              </div>
              <div className="col-4">
                <ClusterSummary clusterOverview={co} />
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <ClusterPerformance clusterID={clusterID} />
                <ClusterNodes       clusterID={clusterID} />
                <ClusterNamespaces  clusterID={clusterID} />
              </div>
            </div>
          </div>
        }
      </div>
    );
  }
}

ClusterOverview.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default ClusterOverview;


