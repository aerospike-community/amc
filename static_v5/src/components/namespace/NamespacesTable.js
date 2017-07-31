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
      showRawStats: new Set(), // namespaces to display the raw stats for
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
    const { expanded, expandAll, showRawStats } = this.state;
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
        const ncols = 6;

        // toggle button
        const toggle = () => {
          const s = new Set(showRawStats);
          if (s.has(name))
            s.delete(name);
          else
            s.add(name);
          this.setState({
            showRawStats: s
          });
        };
        const text = showRawStats.has(name) ? 'Hide Raw Stats' : 'Show Raw Stats';
        data.push(
          <tr key={name+'_raw_stats'}>
            <td colSpan={ncols} className="as-link" onClick={toggle}>
              {text}
            </td>
          </tr>
        );

        // raw stats or not
        const props = showRawStats.has(name) ? stats.raw_stats : stats;
        const r = renderStatsInTable(name, props, ncols);
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

