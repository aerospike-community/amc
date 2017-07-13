import React from 'react';
import { render } from 'react-dom';

import { isInteger, addCommasToInt } from 'classes/util';

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
    const divs = []; 
    const rowKeys = keys.slice(i, i+nr);
    const processStat = (val) => {
      if (!isInteger(val))
        return val + '';

      return addCommasToInt(val);
    };

    const emptyWidth = 5; // percent
    const width = Math.floor((100-emptyWidth*nr)/(2*nr));
    rowKeys.forEach((k) => {
      const stat = processStat(stats[k]);
      divs.push(<div className="as-stat-row" title={k} style={{width: width + '%'}} key={k}> {k} </div>);
      divs.push(<div className="as-stat-row" title={stat} style={{width: width + '%'}} key={k+'val'}> {stat} </div>);
      divs.push(<div className="float-left"  style={{width: emptyWidth + '%', minHeight: 1}} key={k+'empty'}></div>); // empty separator
    });

    rows.push(
      <tr className="as-trow-stat" key={i+name}>
        <td colSpan={ncols}>
          {divs}
        </td>
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

