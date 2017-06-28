import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import ClusterStorage from 'components/cluster/ClusterStorage';
import ClusterSummary from 'components/cluster/ClusterSummary';
import ClusterThroughput from 'components/cluster/ClusterThroughput';
import ClusterNamespaces from 'components/cluster/ClusterNamespaces';
import NodesSummary from 'components/node/NodesSummary';
import Spinner from 'components/Spinner';

import { getConnectionDetails } from 'api/clusterConnections';

// ClusterOverview provides an overview of the cluster
class ClusterOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: true,
      clusterOverview: null,
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
      .catch((message) => {
        // TODO
        console.error(message);
      });
  }

  render() {
    const { clusterID, onSelectNode }  = this.props;
    const co = this.state.clusterOverview;
    const nodeHosts = co ? co.nodes : [];

    return (
      <div> 
        {this.state.isFetching && 
          <div> <Spinner /> Loading ... </div>
        }
        {!this.state.isFetching && 
          <div>
            <div className="row">
              <div className="col-xl-4 as-section">
                <div className="row">
                  <div className="col-xl-12 as-section-header">
                    Disk
                  </div>
                </div>
                <div className="row">
                  <div className="col-xl-12">
                    <ClusterStorage name={'Disk'} storage={co.disk} />
                  </div>
                </div>
              </div>

              <div className="col-xl-4 as-section">
                <div className="row">
                  <div className="col-xl-12 as-section-header">
                    RAM
                  </div>
                </div>
                <div className="row">
                  <div className="col-xl-12">
                    <ClusterStorage name={'RAM'} storage={co.memory} />
                  </div>
                </div>
              </div>

              <div className="col-xl-4 as-section">
                <div className="row">
                  <div className="col-xl-12 as-section-header">
                    Summary
                  </div>
                </div>
                <div className="row">
                  <div className="col-xl-12">
                    <ClusterSummary clusterOverview={co} />
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-xl-12 as-section">
                <ClusterThroughput clusterID={clusterID} />
              </div>
            </div>

            <div className="row">
              <div className="col-xl-12 as-section">
                <NodesSummary clusterID={clusterID} nodeHosts={nodeHosts} onSelectNode={onSelectNode} />
              </div>
            </div>
            <div className="row">
              <div className="col-xl-12 as-section">
                <ClusterNamespaces clusterID={clusterID} />
              </div>
            </div>
          </div>
        }
      </div>
    );
  }
}

ClusterOverview.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  // callback to select a node
  // onSelectNode(clusterID, nodeHost)
  onSelectNode: PropTypes.func,
};

export default ClusterOverview;


