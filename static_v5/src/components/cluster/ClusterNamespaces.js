import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import NamespacesTable from 'components/namespace/NamespacesTable';
import { getNamespaces } from 'api/clusterConnections';

// ClusterNamespaces provides an overview of the cluster namespaces
class ClusterNamespaces extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      namespaces: []
    };
  }

  componentDidMount() {
    this.fetchNamespaces();
  }

  fetchNamespaces() {
    const { clusterID } = this.props;

    getNamespaces(clusterID)
      .then((namespaces) => {
        let arr = [];
        for (let k in namespaces)
          arr.push(namespaces[k]);

        this.setState({
          namespaces: arr
        });
      })
      .catch((message) => {
        console.error(message);
      });
  }

  render() {
    const { namespaces } = this.state;
    return <NamespacesTable namespaces={namespaces} />;
  }
}

ClusterNamespaces.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default ClusterNamespaces;



