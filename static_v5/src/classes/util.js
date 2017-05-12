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
