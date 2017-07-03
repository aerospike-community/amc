import $ from 'jquery';
import { formatTimeWindow as formatWindow } from 'classes/util';
import moment from 'moment';

// watch for change in element size every interval milliseconds and if there
// is a change execute the callback function.
export function watchElementSizeChange(selector, callback, interval = 500) {
    const elm = $(selector);
    let height = elm.height();
    let width = elm.width();

    let id = setInterval(() => {
      const s = $(selector);
      // element removed
      // stop watching for size changes
      if (s.length === 0) { 
        clearInterval(id);
        return;
      }

      // if size of element has changed execute callback
      const h = s.height(), w = s.width();
      if (height !== h || width !== w) {
        height = h;
        width = w;
        callback();
      }
    }, interval); 
}

// for a time x, if now-x <= MarginMinutes then
// x is considered current
export const MarginMinutes = 2;

// isCloseToNow returns true iff time is within MarginMinutes
// of now
export function isCloseToNow(time) {
  return moment().diff(time, 'minutes') <= MarginMinutes;
}

// formatTimeWindow formats the time as
// either 'Last x minutes' or as 'from - to'
export function formatTimeWindow(from, to) {
  // if not current display as 'from' - 'to'
  if (!isCloseToNow(to))
    return formatWindow(from, to);

  // if from-to > 1 hour display as 'from' - 'to'
  if (to.diff(from, 'minutes') > 60)
    return formatWindow(from ,to);

  if (to.diff(from, 'minutes') === 60)
    return 'Last 1 hour';

  return 'Last ' + to.diff(from, 'minutes') + ' minutes';
}

