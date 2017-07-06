import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import { renderStatsInTable } from 'classes/renderUtil';
import { getIndexes as getIndexesAPI } from 'api/index';
import IndexesTable from 'components/index/IndexesTable';
import Spinner from 'components/Spinner';

// IndexesOverview provides an overview of the indexes of a cluster
class IndexesOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: false,
      indexes: [],
    };

    this.onSelectIndex = this.onSelectIndex.bind(this);
  }

  onSelectIndex(indexName) {
    const { clusterID } = this.props;
    this.props.onSelectIndex(clusterID, indexName);
  }

  componentWillMount() {
    const { clusterID } = this.props;
    this.fetchIndexes(clusterID);
  }

  fetchIndexes(clusterID) {
    this.setState({
      isFetching: true
    });

    getIndexesAPI(clusterID)
      .then((indexes) => {
        this.setState({
          indexes: indexes,
          isFetching: false
        });
      })
      .catch((message) => {
        // TODO
        console.error(message);
      });
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID } = nextProps;

    if (this.props.clusterID === clusterID)
      return;

    this.fetchIndexes(clusterID);
  }

  render() {
    const { isFetching, indexes } = this.state;
    if (isFetching)
      return <div> <Spinner /> Loading ... </div>;

    const header = `Indexes - ${this.props.clusterID}`;
    return (
      <div>
        <div className="row">
          <div className="col-xl-12 as-section-header">
            {header} 
          </div>
        </div>

        <IndexesTable indexes={indexes} onSelectIndex={this.onSelectIndex}/>
      </div>
    );
  }
}

IndexesOverview.PropTypes = {
  clusterID: PropTypes.string.isRequired,

  // callback to select a index
  // onSelectIndex(clusterID, indexName)
  onSelectIndex: PropTypes.func,
};

export default IndexesOverview;




