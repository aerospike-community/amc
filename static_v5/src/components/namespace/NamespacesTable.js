import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import bytes from 'bytes';

import { renderStatsInTable } from 'classes/renderUtil';
import { addZeroWidthSpace } from 'classes/util';

// NamespacesTable provides a tabular representation of the namespaces 
// of a cluster
class NamespacesTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: new Set(), 
      expandAll: props.initiallyExpandAll,
    },

    this.onExpand = this.onExpand.bind(this);
    this.onCollapse = this.onCollapse.bind(this);
  }

  onExpand(namespaceName) {
    const s = new Set(this.state.expanded);
    s.add(namespaceName);

    this.setState({
      expanded: s
    });
  }

  onCollapse(namespaceName) {
    const s = new Set(this.state.expanded);
    s.delete(namespaceName);

    this.setState({
      expanded: s,
      expandAll: false,
    });
  }

  namespaces() {
    const { namespaces } = this.props;
    const { expanded, expandAll } = this.state;
    const azw = (text) => ({__html: addZeroWidthSpace(text)});
    const memory = (s) => {
      return bytes(s['used-bytes']) + ' / ' +  bytes(s['total-bytes']);
    }

    let data = [];
    namespaces.forEach((ns) => {
      const { stats, name } = ns;
      const isExpanded = expanded.has(name) || expandAll;

      const row = (
        <tr key={name}>
          <td> 
            <span>
              {isExpanded &&
              <span className="as-hide-stat" onClick={() => this.onCollapse(name)} />
              }

              {!isExpanded &&
              <span className="as-show-stat" onClick={() => this.onExpand(name)} />
              }
            </span>

            <span dangerouslySetInnerHTML={azw(name)} />
          </td>
          <td> {memory(ns.disk)} </td>
          <td> {memory(ns.memory)} </td>
          <td> {stats['repl-factor']} </td>
          <td> {stats['master-objects']} </td>
          <td> {stats['prole-objects']} </td>
        </tr>
      );
      data.push(row);

      if (isExpanded) {
        const r = renderStatsInTable(name, stats, 6);
        data = data.concat(r);
      }
    });

    return data;
  }

  render() {
    const namespaces = this.namespaces();
    return (
      <div>
        <div className="row">
          <div className="col-xl-12 as-section-header">
            Namespaces
          </div>
        </div>
        <div className="row">
          <div className="col-xl-12"> 
            <Table size="sm" bordered hover>
              <thead>
                <tr>
                  <th> Name </th>
                  <th> Disk </th>
                  <th> RAM </th>
                  <th> Replication factor </th>
                  <th> Master Objects </th>
                  <th> Replication Objects </th>
                </tr>
              </thead>
              <tbody>
                {namespaces}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    );
  }
}

NamespacesTable.PropTypes = {
  namespaces: PropTypes.arrayOf(PropTypes.object),
  // whether to expand all the rows on 
  // initial rendering
  initiallyExpandAll: PropTypes.bool,
  
};

export default NamespacesTable;

