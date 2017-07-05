import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import { renderStatsInTable } from 'classes/renderUtil';

// IndexesTable provides a tabular view of the indexes
class IndexesTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: new Set(), 
    };

    this.onExpand = this.onExpand.bind(this);
    this.onCollapse = this.onCollapse.bind(this);
    this.onSelectIndex = this.onSelectIndex.bind(this);
  }

  onSelectIndex(indexName) {
    this.props.onSelectIndex(indexName);
  }

  onExpand(indexName) {
    const s = new Set(this.state.expanded);
    s.add(indexName);

    this.setState({
      expanded: s
    });
  }

  onCollapse(indexName) {
    const s = new Set(this.state.expanded);
    s.delete(indexName);

    this.setState({
      expanded: s
    });
  }

  renderIndexes() {
    const { expanded } = this.state;
    const { indexes, onSelectIndex } = this.props;
    const isSelectable = typeof(onSelectIndex) === 'function';

    let data = [];
    indexes.forEach((index, i) => {
      const { bin, binType, name } = index;
      const { namespace, set, syncOnAllNodes } = index;
      const isExpanded = expanded.has(name);

      const row = (
        <tr key={name + i}>
          <td>
            {isSelectable &&
            <span className="as-link" onClick={() => this.onSelectIndex(name)}> 
              {name} 
            </span>
            }

            {!isSelectable && 
            <span> {name} </span>
            }


            <span className="pull-left">
              {isExpanded &&
              <span className="as-hide-stat" onClick={() => this.onCollapse(name)} />
              }

              {!isExpanded &&
              <span className="as-show-stat" onClick={() => this.onExpand(name)} />
              }
            </span>
          </td>
          <td> {namespace} </td>
          <td> {set} </td>
          <td> {bin} </td>
          <td> {binType} </td>
          <td> {syncOnAllNodes} </td>
        </tr>
      );
      data.push(row);

      if (isExpanded) {
        const r = renderStatsInTable(name, index.Stats, 6);
        data = data.concat(r);
      }
    });

    return data;
  }

  render() {
    const { isFetching, indexes } = this.state;
    const header = this.props.header || 'Indexes';

    return (
      <div>
        <div className="row">
          <div className="col-xl-12 as-section-header">
          {header} 
          </div>
        </div>
        <div className="row">
          <div className="col-xl-12"> 
            <Table size="sm" bordered>
              <thead>
                <tr>
                  <th> Name </th>
                  <th> Namespace</th>
                  <th> Set </th>
                  <th> Bin </th>
                  <th> Bin Type </th>
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

IndexesTable.PropTypes = {
  indexes: PropTypes.arrayOf(PropTypes.object),
  // header of the table
  header: PropTypes.string,

  // callback to select a index
  // onSelectIndex(clusterID, indexName)
  onSelectIndex: PropTypes.func,
};

export default IndexesTable;





