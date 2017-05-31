import $ from 'jquery';

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
