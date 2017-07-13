import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import bytes from 'bytes';

import { renderStatsInTable } from 'classes/renderUtil';
import { addZeroWidthSpace } from 'classes/util';

// SetsTable provides a tabular representation of the sets 
class SetsTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: new Set(), 
      expandAll: props.initiallyExpandAll,
    },

    this.onExpand = this.onExpand.bind(this);
    this.onCollapse = this.onCollapse.bind(this);
    this.onSelectSet = this.onSelectSet.bind(this);
  }

  onSelectSet(setName) {
    this.props.onSelectSet(setName);
  }

  onExpand(setName) {
    const s = new Set(this.state.expanded);
    s.add(setName);

    this.setState({
      expanded: s
    });
  }

  onCollapse(setName) {
    const s = new Set(this.state.expanded);
    s.delete(setName);

    this.setState({
      expanded: s,
      expandAll: false,
    });
  }

  sets() {
    const { sets, onSelectSet } = this.props;
    const { expanded, expandAll } = this.state;
    const isSelectable = typeof(onSelectSet) === 'function';
    const azw = (text) => ({__html: addZeroWidthSpace(text)});

    let data = [];
    sets.forEach((set) => {
      const name = set.set_name;
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

            {isSelectable &&
            <span className="as-link" onClick={() => this.onSelectSet(name)}> 
              <span dangerouslySetInnerHTML={azw(name)} />
            </span>
            }

            {!isSelectable && 
            <span dangerouslySetInnerHTML={azw(name)} />
            }
          </td>
          <td dangerouslySetInnerHTML={azw(set.ns_name)} />
          <td> {set.objects} </td>
          <td> {bytes(set.memory_data_bytes)} </td>
        </tr>
      );
      data.push(row);

      if (isExpanded) {
        const r = renderStatsInTable(name, set, 4);
        data = data.concat(r);
      }
    });

    return data;
  }

  render() {
    const sets = this.sets();
    return (
      <div>
        <div className="row">
          <div className="col-xl-12"> 
            <Table size="sm" bordered hover>
              <thead>
                <tr>
                  <th> Set </th>
                  <th> Namespace </th>
                  <th> # of Objects </th>
                  <th> Memory </th>
                </tr>
              </thead>
              <tbody>
                {sets}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    );
  }
}

SetsTable.PropTypes = {
  sets: PropTypes.arrayOf(PropTypes.object),
  // whether to expand all the rows on 
  // initial rendering
  initiallyExpandAll: PropTypes.bool,
  
  // callback to select a set
  // onSelectSet(setName)
  onSelectSet: PropTypes.func,
};

export default SetsTable;


