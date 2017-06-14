import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import { getIndexes as getIndexesAPI } from 'api/index';
import Spinner from 'components/Spinner';

// IndexesOverview provides an overview of the indexes of a cluster
class IndexesOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: false,
      indexes: []
    };
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

  renderIndexes() {
    const { indexes } = this.state;

    const data = [];
    indexes.forEach((index, i) => {
      const { bin, binType, name } = index;
      const { namespace, set, syncOnAllNodes } = index;
      const row = (
        <tr key={name + i}>
          <td> {namespace} </td>
          <td> {set} </td>
          <td> {bin} </td>
          <td> {binType} </td>
          <td> {name} </td>
          <td> {syncOnAllNodes} </td>
        </tr>
      );
      data.push(row);
    });

    return data;
  }

  render() {
    const { isFetching, indexes } = this.state;
    if (isFetching)
      return <div> <Spinner /> Loading ... </div>;

    return (
      <div>
        <div className="row">
          <div className="col-xl-12 as-section-header">
            Indexes
          </div>
        </div>
        <div className="row">
          <div className="col-xl-12"> 
            <Table size="sm" bordered>
              <thead>
                <tr>
                  <th> Namespace</th>
                  <th> Set </th>
                  <th> Bin </th>
                  <th> Bin Type </th>
                  <th> Name </th>
                  <th> Synhronized on all nodes </th>
                </tr>
              </thead>
              <tbody>
                {this.renderIndexes()}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    );
  }
}

IndexesOverview.PropTypes = {
  clusterID: PropTypes.string.required,
};

export default IndexesOverview;




