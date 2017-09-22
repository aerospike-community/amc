import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { getSets } from 'api/set';
import SetsTable from 'components/set/SetsTable';

// SetsOverview diplays an overview of the sets in a cluster
class SetsOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sets: [],
    };

    this.onSelectSet = this.onSelectSet.bind(this);
  }

  onSelectSet(setName) {
    const {clusterID, nodeHost, namespaceName} = this.props;
    this.props.onShowSet(clusterID, nodeHost, namespaceName, setName);
  }

  componentWillMount() {
    const {clusterID, nodeHost, namespaceName} = this.props;
    getSets(clusterID, nodeHost, namespaceName)
      .then((response) => {
        const sets = response.map((r) => r.set);
        this.setState({
          sets: sets,
        });
      })
      .catch((message) => {
        console.error(message);
      });
  }

  render() {
    const { sets } = this.state;
    const { nodeHost, namespaceName } = this.props;

    return (
      <div>
        <div className="row">
          <div className="col-xl-12 as-section-header">
            Sets
          </div>
        </div>
        <SetsTable onSelectSet={this.onSelectSet} sets={sets}/>
      </div>
    );
  }
}

SetsOverview.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
  namespaceName: PropTypes.string.isRequired,

  // callback to select a set
  // onShowSet(clusterID, nodeHost, namespaceName, setName)
  onShowSet: PropTypes.func,
};


export default SetsOverview;

