import React from 'react';
import { render } from 'react-dom';

import { isNumber, addCommas } from 'classes/util';

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

  // all stats
  const nr = Math.floor(ncols/3); // number of stats per row
  for (let i = 0; i < keys.length; i += nr) {
    const cols = []; 
    const rowKeys = keys.slice(i, i+nr);
    const processStat = (val) => {
      if (!isNumber(val))
        return val + '';

      return addCommas(val);
    };

    rowKeys.forEach((k) => {
      const style = {
        paddingLeft: 20, 
        fontStyle: 'italic',
        borderBottom: '1px solid #dfdfdf',
      };

      const stat = processStat(stats[k]);
      cols.push(<td key={k+'empty'}></td>); // empty column
      cols.push(<td style={style} key={k}> {k} </td>);
      cols.push(<td style={style} key={k+'val'}> {stat} </td>);
    });

    const nkeys = rowKeys.length; // number of keys added in this row
    for (let j = 3*nkeys; j < ncols; j++) {
      cols.push(<td key={'empty' + j + name}></td>); // empty column
    }

    rows.push(
      <tr className="as-trow-stat" key={i+name}>
        {cols}
      </tr>
    );
  }

  // empty row
  const cols = [];
  for (let i = 0; i < ncols; i++) 
    cols.push(<td key={'last' + i + name}> </td>);
  rows.push(
    <tr key={'last' + name} style={{height: 25}}>
      {cols}
    </tr>
  );

  return rows;
}

