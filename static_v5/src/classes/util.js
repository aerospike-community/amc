import moment from 'moment';

/** 
 * Returns a function that checks for "obj" property type in React
 * @param {object} obj - the property type to check for
 */
export function objectPropType(obj) {
  // see https://github.com/facebook/react/issues/5676
  return lazyFunction(() => obj);

  function lazyFunction(f) {
    return function() {
      return f.apply(this, arguments);
    };
  }
}

/**
 * Returns a unique number
 */
export const nextNumber = (() => {
  let i = 0;
  return () => {
    return i++;
  };
})();

/**
 * Calculate the distance to bottom of viewport
 * for the given HTML element
 */
export function distanceToBottom(elm) {
  const rect = elm.getBoundingClientRect();
  return window.innerHeight - rect.top;
}

export function removeLeadingSlash(path) {
  if (path.startsWith('/'))
    path = path.slice('/'.length)

  return path;
}

export function removeTrailingSlash(path) {
  if (path.endsWith('/'))
    path = path.slice(0, -1 * '/'.length);

  return path;
}

// returns s + '/' + t with no duplicated forward slashes
function joinURL(s, t) {
  if (s.length === 0 && t.length === 0)
    return '';
  else if (s.length === 0)
    return t;
  else if (t.length === 0)
    return s;

  // also takes care of the case when s === '/'
  s = removeTrailingSlash(s);
  t = removeLeadingSlash(t);
  return s + '/' + t;
}

// formatTimeWindow formats the time window
//
// 2:55 - 3:25 p.m 8th Jun 
// 11:55 a.m - 12:25 p.m 8th Jun
// 11:55 p.m 7th Jun - 12:25 a.m 8th Jun
export function formatTimeWindow(from, to, sep = ' - ') {
  from = moment(from);
  to = moment(to);

  const format = 'h:mm a Do MMM';
  const now = moment();

  let fromFormat = format;
  if (!from.isSame(to, 'year'))
    fromFormat += ' YY';
  else if (from.isSame(to, 'month') && from.isSame(to, 'day')) { // same day
    fromFormat = 'h:mm';
    if (from.hours() < 12 && to.hours() >= 12) // not same meridiem, i.e am/pm
      fromFormat += ' a';
  }

  let toFormat = format;
  if (!from.isSame(to, 'year') || !to.isSame(now, 'year'))
    toFormat += ' YY';

  return from.format(fromFormat) + sep + to.format(toFormat);
}

// replaceUnicode replaces embedded unicode with the 
// corresponding values
//
// Ex: replaceUnicode('&#2264; 1ms') => ≤ 1ms
export function replaceUnicode(s) {
  const prefix = '&#x';
  const suffix = ';';
  const re = new RegExp(prefix + '[0-9]+' + suffix, 'g');
  return s.replace(re, (t) => {
    t = t.slice(prefix.length, -1*suffix.length);
    t = parseInt(t, 16); // hexadecimal code point
    return String.fromCharCode(t);
  });
}

// addZeroWidthSpace adds a zero width space to text 
// after every 'n' of characters
//
// see https://en.wikipedia.org/wiki/Zero-width_space
export function addZeroWidthSpace(text, n = 1) {
  const zws = '&#x200B;'; // zero width space

  let s = '';
  for (let i = 0; i < text.length; i += n) 
    s += text.slice(i, i+n) + zws;

  return s;
}
