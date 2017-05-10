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
