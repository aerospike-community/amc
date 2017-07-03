import React from 'react';
import { render } from 'react-dom';

// renderStatsInTable renders the stats in the table
//
// name - name of the stat. Used as the key in React rendering
// stats - all the stats to display
// ncols - number of columns in the table. should be >= 3
export function renderStatsInTable(name, stats, ncols) {
  const keys = [];
  for (let k in stats) {
    if (typeof(stats[k]) !== 'object')
      keys.push(k);
  }

  let rows = [];
  // empty row
  rows.push(<tr key={'first' + name} style={{height: 25}}></tr>);

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
      cols.push(<td key={'empty' + j + name}></td>); // empty column
    }

    rows.push(
      <tr key={i+name}>
        {cols}
      </tr>
    );
  }

  // empty row
  rows.push(<tr key={'last' + name} style={{height: 25}}></tr>);

  return rows;
}

