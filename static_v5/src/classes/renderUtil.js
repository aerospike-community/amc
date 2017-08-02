import React from 'react';
import { render } from 'react-dom';

import { isInteger, addCommasToInt, nextNumber } from 'classes/util';

// renderStatsInTable renders the stats in the table
//
// name - name of the stat. Used as the key in React rendering
// stats - all the stats to display
// ncols - number of columns in the table. should be >= 3
export function renderStatsInTable(name, stats, ncols) {
  const nr = Math.floor(ncols/3); // number of stats per row
  let keys = extractKeys(stats);
  keys = columnSort(keys, nr);

  // all stats
  let rows = [];
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
      divs.push(<div className="as-stat-row-key" title={k} style={{width: width + '%'}} key={k}> {k} </div>);
      divs.push(<div className="as-stat-row-value" title={stat} style={{width: width + '%'}} key={k+'val'}> {stat} </div>);
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
  rows.push(emptyRow());

  return rows;


  function emptyRow() {
    const n = nextNumber();
    let k, i;

    const cols = [];
    for (i = 0; i < ncols; i++) {
      k = (i+n) + name;
      cols.push(<td key={k}> </td>);
    }

    k = 'row' + name;
    return (
      <tr className="as-trow-stat" key={k} style={{height: 25}}>
        {cols}
      </tr>
    );
  }
}

// extract keys from the stats
function extractKeys(stats) {
  const keys = [];
  for (let k in stats) {
    if (typeof(stats[k]) !== 'object')
      keys.push(k);
  }
  return keys;
}

// arrange the keys in the columns such that they are vertically ordered
// n - number of columns
function columnSort(keys, n) {
  keys = keys.slice();
  keys.sort();

  const sorted = [];
  let start = 0;
  let i = start;
  keys.forEach((k) => {
    sorted[i] = k;

    i += n;
    if (i >= keys.length)
      i = ++start;
  });

  return sorted;
}

