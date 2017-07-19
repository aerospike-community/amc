import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import NodeThroughput from 'components/node/NodeThroughput';
import ClusterThroughput from 'components/cluster/ClusterThroughput';

import { getConnectionDetails } from 'api/clusterConnections';

class ClusterThroughputOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: true,
      clusterOverview: null,
    };
  }

  fetchDetails(clusterID) {
    this.setState({
      isFetching: true
    });

    getConnectionDetails(clusterID)
      .then((details) => {
        this.setState({
          isFetching: false,
          clusterOverview: details
        });
      })
      .catch((message) => {
        this.setState({
          isFetching: false,
        });
        // TODO
        console.error(message);
      });
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID } = nextProps;

    if (this.props.clusterID !== clusterID)
      this.fetchDetails(clusterID);
  }

  componentDidMount() {
    const { clusterID }  = this.props;
    this.fetchDetails(clusterID);
  }

  render() {
    const { clusterID } = this.props;
    const { isFetching, clusterOverview } = this.state;

    return (
      <div>
        <ClusterThroughput clusterID={clusterID} />

        {!isFetching &&
          clusterOverview.nodes.map((node) => {
            return (
              <div key={node}>
                <NodeThroughput clusterID={clusterID} nodeHost={node} />
              </div>
            );
          })
        }
      </div>
    );
  }
}

ClusterThroughputOverview.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default ClusterThroughputOverview;


