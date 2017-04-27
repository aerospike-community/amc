/** 
 * Returns a function that checks for "obj" property type in React
 * @param {object} obj - the property type to check for
 */
export const objectPropType = function(obj) {
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

// checkAndCallFunction checks that the argument is of type function
// and calls it with args. If not of type function prints the warnMsg
export const checkAndCallFunction = function(fn, warnMsg, ...args) {
  const type = typeof fn;
  warnMsg = warnMsg || `${fn} is not a function, is of type ${type}`;
  if (type === 'function')
    fn(...args);
  else
    console.warn(warnMsg);
}

