import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import bytes from 'bytes';

// SetsTable provides a tabular representation of the sets 
class SetsTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: new Set(), 
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
      expanded: s
    });
  }

  // ncols should be >= 3
  renderStats(setName, stats, ncols) {
    const keys = [];
    for (let k in stats) {
      if (typeof(stats[k]) !== 'object')
        keys.push(k);
    }

    let rows = [];
    // empty row
    rows.push(<tr key={'first' + setName} style={{height: 25}}></tr>);

    // all stats
    const nr = Math.floor(ncols/3); // number of stats per row
    for (let i = 0; i < keys.length; i += nr) {
      const cols = []; 
      const style = { fontStyle: 'italic' };
      keys.slice(i, i+nr).forEach((k) => {
        cols.push(<td key={'empty' + k}></td>); // empty column
        cols.push(<td style={style} key={k}> {k} </td>);
        cols.push(<td style={style} key={k+'val'}> {stats[k] + ''} </td>);
      });

      for (let j = 3*nr; j < ncols; j++) {
        cols.push(<td key={'empty' + setName + j}></td>); // empty column
      }

      rows.push(
        <tr key={setName+i}>
          {cols}
        </tr>
      );
    }

    // empty row
    rows.push(<tr key={'last' + setName} style={{height: 25}}></tr>);

    return rows;
  }

  sets() {
    const { sets, onSelectSet } = this.props;
    const { expanded } = this.state;
    const isSelectable = typeof(onSelectSet) === 'function';

    let data = [];
    sets.forEach((set) => {
      const name = set.set_name;
      const isExpanded = expanded.has(name);

      const row = (
        <tr key={name}>
          <td> 
            {isSelectable &&
            <span className="as-link" onClick={() => this.onSelectSet(name)}> 
              {name} 
            </span>
            }

            {!isSelectable && 
            <span> {name} </span>
            }

            <span className="pull-right">
              {isExpanded &&
              <small className="as-link" onClick={() => this.onCollapse(name)}>
                Less
              </small>
              }

              {!isExpanded &&
              <small className="as-link" onClick={() => this.onExpand(name)}>
                More
              </small>
              }
            </span>
          </td>
          <td> {set.ns_name} </td>
          <td> {set.objects} </td>
          <td> {bytes(set.memory_data_bytes)} </td>
        </tr>
      );
      data.push(row);

      if (isExpanded) {
        const r = this.renderStats(name, set, 4);
        data = data.concat(r);
      }
    });

    return data;
  }

  render() {
    const sets = this.sets();
    const header = this.props.header || 'Sets';
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
  // header of the table
  header: PropTypes.string,

  // callback to select a set
  // onSelectSet(setName)
  onSelectSet: PropTypes.func,
};

export default SetsTable;


